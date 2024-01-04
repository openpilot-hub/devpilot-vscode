
import { Message } from "@/completion/typing";
import axios from "axios";

export default class AzureProvider {
  
  public name = 'azure';
  
  constructor(
    public apiEndpoint = '',
    public apiKey: string = '',
    public model: string = 'gpt-3.5-turbo'
  ) {}

  async chat(messages: Message[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Azure API key is required');
    }
    try {
      const response = await axios.post(this.apiEndpoint, {
        messages,
        model: this.model,
        stream: true
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAP_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });
      return response.data['choices'][0]['message']['content'];
    } catch (error: any) {
      console.error('[DevPilot][EXT]', error);
      if (error.message === 'timeout of 60000ms exceeded') {
        throw new Error('Azure API request timeout');
      }
      if (error.response) {
        throw new Error(`Azure API request failed with status code ${error.response.status}`);
      }
      throw new Error('Azure API request failed');
    }
  }

}