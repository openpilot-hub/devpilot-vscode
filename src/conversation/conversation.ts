import { Message } from "@/completion/typing";

let convo: Conversation | null = null;

export class Conversation {
  
  messages: Message[];
  
  constructor(messages: Message[] = []) {
    this.messages = messages;
  }

  addMessage(message: Message) {
    this.messages.push(message);
    return message;
  }

  replaceTextToLastMessage(text: string) {
    this.messages[this.messages.length - 1].content = text;
  }

}

export function getCurrentConversation(): Conversation {
  if (!convo) {
    convo = new Conversation([]);
  }
  return convo;
}

export function startNewConversation(messages?: Message[]) {
  convo = new Conversation(messages);
  return convo;
}