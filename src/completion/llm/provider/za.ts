import axios from 'axios';
import { Message } from "../../typing";

export default class ZAProvider {
  public name = 'za';
  
  constructor(
    public apiEndpoint = 'http://openapi-cloud-pub.zhonganinfo.com/dev/devpilot/v1/chat/completions',
    public model: string = 'gpt-3.5-turbo'
  ) {}
  
  async chat(messages: Message[]): Promise<string> {
    const response = await axios.post(this.apiEndpoint, {
      model: this.model,
      messages: messages,
      stream: false
    }, {
      headers: {
        'User-Agent': 'test_prompt',
        'Content-Type': 'application/json'
      },
      timeout: 50000
    });
    return response.data['choices'][0]['message']['content'];
  }
}