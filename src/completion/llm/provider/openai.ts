import { ChatMessage, LLMProviderOption, LLMProvider } from '@/completion/typing';
import { api } from '@/utils/api';
import { logger } from '@/utils/logger';
import { readJSONStream, StreamHandler } from '@/utils/stream';
import { AxiosInstance } from 'axios';
import { LLMChatHandler } from '../../typing';
import { maskSensitiveData } from '../../../utils/masking';

type OpenAIRole = 'user' | 'assistant' | 'system';

interface OpenAIMessage {
  content: string;
  role: OpenAIRole
}

function convertToOpenAIMessages(messages: ChatMessage[]): OpenAIMessage[] {
  const validRoles: OpenAIRole[] = ['user', 'assistant', 'system'];
  return messages
    .filter((msg) => validRoles.includes(msg.role as OpenAIRole))
    .map(
      (msg) =>
        ({
          content: msg.prompt || msg.content,
          role: msg.role,
        } as OpenAIMessage)
    );
}

export default class OpenAIProvider implements LLMProvider {

  public name = 'OpenAI';
  public apiEndpoint: string;
  public apiKey: string;
  public model: string;
  public stream: boolean;
  private api: AxiosInstance;

  constructor(options: LLMProviderOption) {
    this.apiEndpoint = options.apiEndpoint ?? 'https://api.openai.com/v1/chat/completions';
    this.apiKey = options.apiKey ?? '';
    this.model = options.model ?? 'gpt-3.5-turbo';
    logger.debug('Initialize OpenAIProvider', {...options, apiKey: maskSensitiveData(this.apiKey)});
    this.api = api({}, options.proxy);
    this.stream = options.stream ?? false;
  }

  async chat(messages: ChatMessage[]): Promise<LLMChatHandler> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    try {
      const response = await this.api.post(this.apiEndpoint, {
        messages: convertToOpenAIMessages(messages),
        model: this.model,
        temperature: 0.7,
        stream: this.stream || undefined
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        ...(this.stream ? { responseType: 'stream' } : {}),
        timeout: 60000
      });

      if (!this.stream) {
        return response.data.choices[0].message.content;
      }

      let textCollected = '';
      let onTextCallback: (text: string, {id}: {id: string}) => void;
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
          })
        },
        interrupt: () => {
          streamHandler?.interrupt?.();
        },
      };

      streamHandler = {
        onProgress: (data: any) => {
          const text = data.choices[0].delta.content ?? '';
          textCollected += text;
          onTextCallback?.(textCollected, {id: data.id});
        },
        onInterrupted: () => {
          onInterruptedCallback?.();
        },
        onDone: () => {
          streamDoneResolve(textCollected);
        }
      }
      
      readJSONStream(response.data, streamHandler);

      return ctrl;

    } catch (error: any) {
      console.error('[DevPilot][EXT]', error);
      if (error.message === 'timeout of 60000ms exceeded') {
        throw new Error('OpenAI request timeout');
      }
      if (error.response) {
        console.error(error.response);
        throw new Error(`OpenAI request failed with ${error.response.status}`);
      }
      throw new Error('OpenAI request failed');
    }
  }

}