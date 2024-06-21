import { logger } from '@/utils/logger';
import { readJSONStream, StreamHandler } from '@/utils/stream';
import { ChatMessage, LLMChatHandler, LLMProvider, LLMProviderOption, ProviderType } from '../../typing';
import request, { ZAPI } from '@/utils/request';

type OpenAIRole = 'user' | 'assistant' | 'system';

interface OpenAIMessage {
  content: string;
  role: OpenAIRole;
}

function convertToOpenAIMessages(messages: ChatMessage[]): OpenAIMessage[] {
  const validRoles: OpenAIRole[] = ['user', 'assistant', 'system'];
  return messages
    .filter((msg) => validRoles.includes(msg.role as OpenAIRole))
    .filter((msg) => (msg.prompt || '').trim() !== '')
    .map(
      (msg) =>
        ({
          content: msg.prompt || msg.content,
          role: msg.role,
        } as OpenAIMessage)
    );
}

export default class ZAProvider implements LLMProvider {
  public name: ProviderType = 'ZA';
  public model: string = 'azure/gpt-3.5-turbo';
  private stream: boolean = true;

  async chat(messages: ChatMessage[], extraOptions?: { repo: string }): Promise<LLMChatHandler> {
    try {
      const llmMsgs = convertToOpenAIMessages(messages);
      const repo = extraOptions?.repo;
      const apiEndpoint = repo ? ZAPI('rag') : ZAPI('chat');
      logger.debug('llmMsgs', llmMsgs, 'extraOptions', extraOptions, 'repo', repo, 'apiEndpoint', apiEndpoint);
      const req = request({ timeout: 0, repo });
      const response = await req.post(
        apiEndpoint,
        {
          messages: llmMsgs,
          model: repo ? undefined : this.model,
          temperature: 0.7,
          stream: true,
        },
        {
          ...(this.stream ? { responseType: 'stream' } : {}),
          timeout: 120000,
        }
      );

      if (!this.stream) {
        return response.data.choices[0].message.content;
      }

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
            const text = data.choices[0].delta.content ?? '';
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
          streamDoneResolve(textCollected);
        },
      };

      readJSONStream(response.data, streamHandler);

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
