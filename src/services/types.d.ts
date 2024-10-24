import { DevPilotFunctionality, MessageRole } from '@/typing';

export interface IMessageData {
  role: MessageRole;
  commandType?: DevPilotFunctionality;
  promptData?: {
    selectedCode?: string;
    answerLanguage?: string;
    language?: string;
    relatedContext?: string;
    commandTypeFor?: DevPilotFunctionality;
    diff?: string;
    locale?: string;
  };
  content?: string;
}

export interface IChatParam {
  version: string;
  encoding?: 'base64';
  stream: boolean;
  messages: IMessageData[];
}
