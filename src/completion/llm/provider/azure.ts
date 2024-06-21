import { ChatMessage, LLMChatHandler, LLMProvider } from '../../typing';

export default class AzureProvider implements LLMProvider {
  public name = 'Azure';
  
  constructor(
    public apiEndpoint = '',
    public model: string = ''
  ) {}
  
  async chat(messages: ChatMessage[]): Promise<LLMChatHandler> {
    throw new Error('Method not implemented.');
  }
}
