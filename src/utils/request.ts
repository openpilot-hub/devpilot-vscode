import axios from 'axios';
import vscode from 'vscode';
import LoginController from '@/authentication/controller';
import { logger } from './logger';
import { PUBLIC_API, API, AUTH_ON } from '@/env';
import { configuration } from '@/configuration';
import { getCurrentPluginVersion } from './vscode-extend';

function transformRequest(data: any, headers: axios.AxiosRequestConfig['headers']) {
  if (typeof data === 'string') {
    return data;
  }
  return JSON.stringify(data);
}

export const ZAPI = (type: 'chat' | 'chatV2' | 'completion' | 'tracking' | 'rag', api: string = '') => {
  const { authType } = LoginController.instance.getLoginInfo();
  if (type === 'chatV2') {
    if (authType === 'wx') {
      return PUBLIC_API + '/aigc/v2/chat/completions';
    } else {
      return API + '/devpilot/v2/chat/completions';
    }
  } else if (type === 'chat') {
    if (authType === 'wx') {
      return PUBLIC_API + '/aigc/v1/chat/completions';
    } else {
      return API + '/devpilot/v1/chat/completions';
    }
  } else if (type === 'completion') {
    if (authType === 'wx') {
      return PUBLIC_API + '/aigc/devpilot/v1/code-completion/default';
    } else {
      return API + '/devpilot/v1/code-completion/default';
    }
  } else if (type === 'tracking') {
    return PUBLIC_API + '/hub/devpilot/v1' + api;
  } else if (type === 'rag') {
    return API + '/devpilot/v2/chat/completions';
  } else {
    throw new Error('Unknown API type');
  }
};

export default function request(options?: { timeout: number; repo?: string }) {
  const timeout = options?.timeout ?? 0;
  const repo = options?.repo ?? '';
  const req = axios.create({ timeout, transformRequest });
  req.defaults.headers['Content-Type'] = 'application/json; charset=utf-8';

  req.interceptors.request.use((request) => {
    logger.debug('Starting Request', request.url);
    return request;
  });
  req.interceptors.response.use((response) => {
    logger.debug('Response:', response.status, response.statusText, response.config.url);
    return response;
  });
  req.interceptors.request.use((config) => {
    if (AUTH_ON) {
      const { userId, token, authType } = LoginController.instance.getLoginInfo();
      const pluginVersion = getCurrentPluginVersion();
      const userAgent = `vscode-${vscode.version}|${pluginVersion}|${token}|${userId}`;

      logger.debug('authType', authType);
      logger.debug('useragent', userAgent);

      config.headers.set('User-Agent', userAgent);
      config.headers.set('Auth-Type', authType);
    }

    if (repo) {
      config.headers.set('Embedded-Repos-V2', repo);
    }

    const lang = configuration().llmLocale() === 'Chinese' ? 'zh-CN' : 'en-US';
    config.headers.set('X-B3-Language', lang);

    return config;
  });
  return req;
}

// ======================= v2 ===================== //

export const requestV2 = axios.create({ timeout: 0, transformRequest });

requestV2.defaults.headers['Content-Type'] = 'application/json; charset=utf-8';

requestV2.interceptors.request.use((request) => {
  if (!/^http/.test(request.url!)) {
    const { authType } = LoginController.instance.getLoginInfo();
    request.url = (authType === 'wx' ? PUBLIC_API : API) + request.url;
  }
  logger.debug('Starting Request', request.url, request.data, request.params);
  return request;
});

requestV2.interceptors.response.use((response) => {
  logger.debug('Response:', response.status, response.statusText, response.config.url);
  return response;
});

requestV2.interceptors.request.use((config) => {
  if (AUTH_ON) {
    const { userId, token, authType } = LoginController.instance.getLoginInfo();
    const pluginVersion = getCurrentPluginVersion();
    const userAgent = `vscode-${vscode.version}|${pluginVersion}|${token}|${userId}`;

    logger.debug('authType', authType);
    logger.debug('useragent', userAgent);

    config.headers.set('User-Agent', userAgent);
    config.headers.set('Auth-Type', authType);
  }

  if (config.repo) {
    config.headers.set('Embedded-Repos-V2', config.repo);
  }

  const lang = configuration().llmLocale() === 'Chinese' ? 'zh-CN' : 'en-US';
  config.headers.set('X-B3-Language', lang);

  return config;
});
