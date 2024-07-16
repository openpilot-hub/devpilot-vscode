import { API } from '@/env';
import { logger } from '@/utils/logger';
import request from '@/utils/request';

export async function isRepoEmbedded(repo: string) {
  const repoRes = await request()
    .get(`${API}/devpilot/v1/rag/git_repo/embedding_info/${repo}`)
    .catch((err) => {
      logger.error(err);
      return { data: { embedded: false } };
    });
  logger.info('isRepoEmbedded', repoRes.data);
  return repoRes.data.embedded;
}
