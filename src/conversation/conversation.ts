import { Message } from "@/completion/typing";

let convo: Conversation | null = null;

export class Conversation {
  
  messages: Message[];
  
  constructor(messages: Message[] = []) {
    this.messages = messages;
  }

  get lastMessage(): Message | null {
    return this.messages[this.messages.length - 1] || null;
  }

  addMessage(message: Message) {
    this.messages.push(message);
    return message;
  }

  replaceTextToLastMessage(text: string, streaming: boolean = false) {
    if (!this.lastMessage)
      return;
    this.lastMessage.content = text;
    this.lastMessage.streaming = streaming;
  }

  interruptLastMessage() {
    if (!this.lastMessage)
      return;
    this.lastMessage.streaming = false;
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