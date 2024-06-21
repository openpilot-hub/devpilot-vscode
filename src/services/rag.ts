import domain from '@/utils/domain';
import { logger } from '@/utils/logger';
import request from '@/utils/request';

export async function isRepoEmbedded(repo: string) {
  const repoRes = await request().get(`${domain.API}/devpilot/v1/rag/git_repo/embedding_info/${repo}`);
  logger.info('isRepoEmbedded', repoRes.data);
  return repoRes.data.embedded;
}
