
import { Message } from "@/completion/typing";
import axios from "axios";

export default class AnthropicProvider {
  
  constructor(
    public name = 'anthropic',
    public apiEndpoint = '',
    public apiKey: string = '',
    public model: string = 'claude-2'
  ) {}

  async chat(messages: Message[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key is required');
    }
    try {
      const response = await axios.post(this.apiEndpoint, {
        messages,
        model: this.model,
        stream: true
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.ANTHROPY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });
      return response.data['choices'][0]['message']['content'];
    } catch (error: any) {
      console.error('[DevPilot][EXT]', error);
      if (error.message === 'timeout of 60000ms exceeded') {
        throw new Error('Anthropic API request timeout');
      }
      if (error.response) {
        throw new Error(`Anthropic API request failed with status code ${error.response.status}`);
      }
      throw new Error('Anthropic API request failed');
    }
  }

}