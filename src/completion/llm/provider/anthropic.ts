import { ChatMessage, LLMChatHandler, LLMProvider } from '@/typing';

export default class AnthropicProvider implements LLMProvider {
  public name = 'anthropic';

  constructor(public apiEndpoint = '', public model: string = '') {}

  async chat(messages: ChatMessage[]): Promise<LLMChatHandler> {
    throw new Error('Method not implemented.');
  }
}
