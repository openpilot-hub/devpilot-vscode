import { ChatMessage } from '@/typing';
import { v4 as uuid } from 'uuid';

let convo: Conversation | null = null;

export class Conversation {
  messages: ChatMessage[];

  constructor(messages?: ChatMessage[]) {
    this.messages = messages || [];
  }

  clearAllMessages() {
    this.messages = [];
  }

  get lastMessage(): ChatMessage | null {
    return this.messages[this.messages.length - 1] || null;
  }

  get lastSessionMessages(): ChatMessage[] {
    if (this.messages.length === 0) {
      return [];
    }
    // Find the last divider and return all messages after it
    let msgs: ChatMessage[] = [];
    const dividerIndex = this.messages.map((msg) => msg.role).lastIndexOf('divider');
    if (dividerIndex === -1) msgs = this.messages;
    else msgs = this.messages.slice(dividerIndex + 1);

    if (msgs.length === 0) {
      return msgs;
    }

    return msgs;
  }

  getMessageByID(id: string) {
    return this.messages.find((msg) => msg.id === id);
  }

  getPrevMessageByID(id: string) {
    const idx = this.messages.findIndex((msg) => msg.id === id);
    if (idx > 0) {
      return this.messages[idx - 1];
    }
  }

  addMessage(message: ChatMessage) {
    if (!message.id) {
      message.id = uuid();
    }
    this.messages.push(message);
    return message;
  }

  deletePairMessage(msg: ChatMessage): [ChatMessage, ChatMessage] | undefined {
    const index = this.messages.findIndex((m) => m.id === msg.id);
    if (index !== -1) {
      const deleted = this.messages[index];
      const deleted2 = this.messages[index + 1];
      this.messages.splice(index, 2);
      return [deleted, deleted2];
    }
  }

  deleteMessage(msg: ChatMessage): [ChatMessage, number] | [] {
    const index = this.messages.findIndex((m) => m.id === msg.id);
    if (index !== -1) {
      const deleted = this.messages[index];
      this.messages.splice(index, 1);
      return [deleted, index];
    } else {
      return [];
    }
  }

  replaceToLastMessage(msg: Partial<ChatMessage>, streaming: boolean = false) {
    if (!this.lastMessage) return;
    Object.assign(this.lastMessage, msg);
    this.lastMessage.streaming = streaming;
  }

  interruptLastMessage(msg?: Partial<ChatMessage>) {
    if (!this.lastMessage) return;
    msg && Object.assign(this.lastMessage, msg);
    this.lastMessage.streaming = false;
  }

  insertBefore(msg: ChatMessage, newMsg: ChatMessage) {
    const currIdx = this.messages.indexOf(msg);
    this.messages.splice(currIdx, 0, newMsg);
  }

  lastMessageIsFirstInSession() {
    if (this.messages.length <= 1) {
      return true;
    }
    if (this.messages[this.messages.length - 1].role === 'divider') {
      return true;
    }
    if (this.messages[this.messages.length - 2].role === 'divider') {
      return true;
    }
    return false;
  }
}

export function getCurrentConversation(): Conversation {
  if (!convo) {
    convo = new Conversation([]);
  }
  return convo;
}

export function startNewConversation(messages?: ChatMessage[]) {
  convo = new Conversation(messages);
  return convo;
}
