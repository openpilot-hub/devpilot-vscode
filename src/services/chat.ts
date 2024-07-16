import { getStagedDiff } from '@/utils/git';
import { logger } from '@/utils/logger';
import request, { ZAPI } from '@/utils/request';
import { notifyLogin } from './login';

export const NO_STAGED_FILES = 'no staged files';

export async function generateCommitMsg(options: { signal?: AbortSignal }) {
  const diffStr = await getStagedDiff().catch((error) => {
    logger.error(error);
  });
  if (!diffStr) return Promise.resolve(NO_STAGED_FILES);
  const apiEndpoint = ZAPI('chat');

  const req = request({ timeout: 0 });
  return await req
    .post(
      apiEndpoint,
      {
        version: 'V1',
        stream: false,
        messages: [
          {
            role: 'user',
            commandType: 'GENERATE_COMMIT',
            content: diffStr,
          },
        ],
      },
      { signal: options?.signal }
    )
    .then((res) => res.data?.choices?.[0]?.message?.content)
    .catch((err) => {
      if (err?.response?.status == 401) {
        notifyLogin();
      }
      return Promise.reject(err);
    });
}
