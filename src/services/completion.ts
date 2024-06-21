import { codeCompletionService } from '@/completion/prompts';
import { logger } from '@/utils/logger';
import request, { ZAPI } from '@/utils/request';

/**
 * Get autocompletion
 */
export async function getCompletions(
  data: {
    document: string;
    filePath: string;
    language: string;
    position: number;
    completionType: 'inline' | 'comment';
  },
  signal?: AbortSignal
) {
  return request().post(ZAPI('completion'), data, { timeout: 5000, signal });
}

export async function getCompletionsWithChatPrompt(prefix: string, suffix: string, signal?: AbortSignal) {
  const prompt = `${prefix}<caret>${suffix}`;
  logger.debug('prompt', prompt);

  const res = await request().post(
    ZAPI('chat'),
    {
      messages: [...codeCompletionService, { role: 'user', content: prompt }],
      model: 'azure/gpt-3.5-turbo',
      temperature: 0.7,
      stream: false,
    },
    { timeout: 5000, signal }
  );

  return res;
}
