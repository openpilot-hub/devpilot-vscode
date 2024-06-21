import axios from 'axios';
import vscode from 'vscode';
import LoginController from '@/authentication/controller';
import { logger } from './logger';
import domain from './domain';
import { configuration } from '@/configuration';

export const ZAPI = (type: 'chat' | 'completion' | 'tracking' | 'rag', api: string = '') => {
  const { authType } = LoginController.instance.getLoginInfo();
  if (type === 'chat') {
    if (authType === 'wx') {
      return domain.PUBLIC_API + '/aigc/v1/chat/completions' + api;
    } else {
      return domain.API + '/devpilot/v1/chat/completions' + api;
    }
  } else if (type === 'completion') {
    if (authType === 'wx') {
      return domain.PUBLIC_API + '/aigc/devpilot/v1/code-completion/default';
    } else {
      return domain.API + '/devpilot/v1/code-completion/default';
    }
  } else if (type === 'tracking') {
    return domain.PUBLIC_API + '/hub/devpilot/v1' + api;
  } else if (type === 'rag') {
    return domain.API + '/devpilot/v1/chat/completions' + api;
  } else {
    throw new Error('Unknown API type');
  }
};

export default function request(options?: { timeout: number; repo?: string }) {
  const timeout = options?.timeout ?? 0;
  const repo = options?.repo ?? '';
  const req = axios.create({ timeout });
  req.interceptors.request.use((request) => {
    logger.debug('Starting Request', request.url);
    return request;
  });
  req.interceptors.response.use((response) => {
    logger.debug('Response:', response.status, response.statusText, response.config.url);
    return response;
  });
  req.interceptors.request.use((config) => {
    const { userId, token, authType } = LoginController.instance.getLoginInfo();
    const pluginVersion = vscode.extensions.getExtension('Zhongan.devpilot')?.packageJSON.version;
    const userAgent = `vscode-${vscode.version}|${pluginVersion}|${token}|${userId}`;

    logger.debug('authType', authType);
    logger.debug('useragent', userAgent);

    if (repo) {
      config.headers.set('Embedded-Repos-V2', repo);
    }

    config.headers.set('X-B3-Language', configuration().llmLocale() === 'Chinese' ? 'zh-CN' : 'en-US');
    config.headers.set('User-Agent', userAgent);
    config.headers.set('Auth-Type', authType);
    config.headers.setContentType('application/json');

    return config;
  });
  return req;
}
