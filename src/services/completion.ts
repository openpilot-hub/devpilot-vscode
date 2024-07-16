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
  logger.info('req param', data);
  return request().post(ZAPI('completion'), data, { timeout: 5000, signal });
}
