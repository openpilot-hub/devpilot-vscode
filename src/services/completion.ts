import { PARAM_BASE64_ON } from '@/env';
import { toBase64 } from '@/utils';
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
    encoding?: 'base64';
  },
  signal?: AbortSignal
) {
  if (PARAM_BASE64_ON) {
    data.document = toBase64(data.document);
    data.encoding = 'base64';
  }
  logger.info('req param', data);
  return request().post(ZAPI('completion'), data, { timeout: 5000, signal });
}
