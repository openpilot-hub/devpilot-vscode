import { logger } from '@/utils/logger';
import { readJSONStream, StreamHandler } from '@/utils/stream';
import { ChatMessage, LLMChatHandler, LLMProvider, ProviderType } from '../../../typing';
import request, { ZAPI } from '@/utils/request';
import { configuration } from '@/configuration';
import { PARAM_BASE64_ON } from '@/env';
import { IChatParam, IMessageData } from '@/services/types';
import { encodeRequestBody } from '@/utils/encode';
import { wrapCodeRefInCodeblock } from '@/utils';

type OpenAIRole = 'user' | 'assistant' | 'system';

function convertToOpenAIMessages(messages: ChatMessage[]): IMessageData[] {
  const validRoles: OpenAIRole[] = ['user', 'assistant'];
  const clonedMessages = messages
    .filter((msg) => validRoles.includes(msg.role as OpenAIRole))
    .map((item) => {
      return { ...item };
    });

  clonedMessages.forEach((item, index) => {
    if (item.recall) {
      if (index > 0) {
        clonedMessages[index - 1].recall = item.recall;
      }
      item.recall = undefined;
    }
  });

  const answerLanguage = configuration().llmLocale() === 'Chinese' ? 'zh_CN' : 'en_US';
  return clonedMessages.map((msg) => {
    const { codeRef, recall } = msg;
    const localRefs = recall?.localRefs;
    const promptData: IMessageData['promptData'] | undefined =
      msg.role === 'user'
        ? {
            selectedCode: wrapCodeRefInCodeblock(codeRef),
            answerLanguage,
            language: 'javascript',
            relatedContext: localRefs
              ?.map((ref, index) => {
                const codeBlock = wrapCodeRefInCodeblock(ref);
                const indexStr = `${index + 1}. `;
                if (ref.packageName) {
                  return `\n\n${indexStr}module '${ref.packageName}'\n${codeBlock}`;
                }
                return `\n\n${indexStr}\n${codeBlock}`;
              })
              .join(''),
          }
        : undefined;

    logger.info('relatedContext', promptData?.relatedContext);

    return {
      commandType: msg.commandType,
      content: msg.content,
      role: msg.role,
      promptData,
    };
  });
}

export default class ZAProvider implements LLMProvider {
  public name: ProviderType = 'ZA';
  // private stream: boolean = true;

  async chat(messages: ChatMessage[], extraOptions?: { repo?: string; signal?: AbortSignal }): Promise<LLMChatHandler> {
    try {
      const llmMsgs = convertToOpenAIMessages(messages);
      const repo = extraOptions?.repo;
      const apiEndpoint = repo ? ZAPI('rag') : ZAPI('chatV2');
      logger.debug('llmMsgs', llmMsgs, 'extraOptions', extraOptions, 'repo', repo, 'apiEndpoint', apiEndpoint);
      const req = request({ timeout: 0, repo });

      let param: IChatParam | string = {
        version: 'V240923',
        stream: true,
        messages: llmMsgs,
      };

      if (PARAM_BASE64_ON) {
        param = await encodeRequestBody(param);
      }

      logger.debug('chat param', JSON.stringify(param));

      const response = await req
        .post(apiEndpoint, param, {
          responseType: 'stream',
          timeout: 120000,
          signal: extraOptions?.signal,
        })
        .catch((err) => {
          if (err.code !== 'ERR_CANCELED') {
            throw err;
          }
        });

      let textCollected = '';
      let onTextCallback: (text: string, options: { id: string }) => void;
      let onInterruptedCallback: () => void;
      let streamHandler: StreamHandler | null = null;
      let streamDoneResolve: (value: string) => void;

      const ctrl: LLMChatHandler = {
        onText: (callback) => {
          onTextCallback = callback;
        },
        onInterrupted: (callback) => {
          onInterruptedCallback = callback;
        },
        result: async () => {
          return new Promise((resolve, reject) => {
            streamDoneResolve = resolve;
          });
        },
        interrupt: () => {
          streamHandler?.interrupt?.();
        },
      };

      streamHandler = {
        onProgress: (data: any) => {
          if (data.choices) {
            const text = data.choices[0]?.delta.content ?? '';
            textCollected += text;
            onTextCallback?.(textCollected, { id: data.id });
          } else if (data.rag) {
            let text = `\n\n<div class="rag-files" data-repo="${repo}">`;
            data.rag.files.forEach(({ file }: any) => {
              text += `<div>${file}</div>`;
            });
            text += `</div>\n\n`;
            textCollected += text;
            onTextCallback?.(textCollected, { id: data.id });
          }
        },
        onInterrupted: () => {
          onInterruptedCallback?.();
        },
        onDone: () => {
          logger.info('textCollected =>', textCollected);
          streamDoneResolve(textCollected);
        },
      };

      if (response) {
        readJSONStream(response.data, streamHandler);
      }

      return ctrl;
    } catch (error: any) {
      logger.error('Error when chat with ZA provider', error);
      if (error.message.startsWith('timeout')) {
        throw new Error('ZA request timeout');
      }
      if (error.response) {
        console.error(error.response);
        throw new Error(`ZA request failed with ${error.response.status}`);
      }
      if (error.code || error.message) {
        throw new Error(`ZA request failed: ${error.code || error.message}`);
      }
      throw new Error(`ZA request failed`);
    }
  }
}
