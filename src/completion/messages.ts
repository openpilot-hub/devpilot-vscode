import { Message } from "./typing";

export const createSystemMessage = (content: string, time?: string): Message => {
  return {
    content,
    role: 'system',
    username: '',
    avatar: '',
    time: time ?? new Date().toISOString(),
  };
}

export const createUserMessage = (content: string, time?: string): Message => {
  return {
    content,
    role: 'user',
    username: 'User',
    avatar: '',
    time: time ?? new Date().toISOString(),
  };
}

export const createAssistantMessage = (content: string, time?: string): Message => {
  return {
    content,
    role: 'assistant',
    username: 'DevPilot',
    avatar: '',
    time: time ?? new Date().toISOString(),
  };
}