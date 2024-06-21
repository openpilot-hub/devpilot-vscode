import * as vscode from 'vscode';
import { Locale, ProviderType, LLMProvider } from './completion/typing';
import llmProvider from './completion/llm/provider';
import { logger } from './utils/logger';
import { getCurrentPluginVersion } from './utils/vscode-extend';
import { maskSensitiveData } from './utils/masking';

const DEFAULT_PROVIDER: ProviderType = 'ZA';

function getVSCodeLocale(): Locale {
  if (vscode.env.language.includes('zh')) {
    return Locale.Chinese;
  }
  if (vscode.env.language.includes('en')) {
    return Locale.English;
  }
  return Locale.English;
}

function getDevPilotDefaultLocale(): 'Chinese' | 'English' {
  if (vscode.env.language.includes('zh')) {
    return 'Chinese';
  }
  if (vscode.env.language.includes('en')) {
    return 'English';
  }
  return 'English';
}

export type Configuration = {
  locale: () => Locale;
  llmLocale: () => 'Chinese' | 'English';
  llm: () => LLMProvider;
  username: () => string;
  onConfigChanged: (callback: (key: string, value: any) => void) => number;
};

let globalConfiguration: Configuration;

export function configuration(context?: vscode.ExtensionContext) {
  if (globalConfiguration) {
    return globalConfiguration;
  }
  if (!context) {
    throw new Error('configurationManager needs context');
  }
  const config = vscode.workspace.getConfiguration('devpilot');

  if (config.get('language') !== 'Chinese' && config.get('language') !== 'English') {
    config.update('language', getDevPilotDefaultLocale(), vscode.ConfigurationTarget.Global);
    logger.log('set language', getDevPilotDefaultLocale());
  } else {
    logger.log('has language', config.get('language'));
  }

  const locale = getVSCodeLocale();
  let apiKey = config.get('openaiAPIKey') as string;
  const providerType = config.get<ProviderType>('provider') || DEFAULT_PROVIDER;
  let proxy = config.get('proxy') as string;
  let model = config.get('model') as string;
  if (providerType === 'ZA') {
    proxy = '';
    apiKey = '';
    model = '';
  }
  let llm = llmProvider.get(providerType, {
    apiKey,
    proxy,
    model,
    stream: true,
    authType: () => context.globalState.get('AUTH_TYPE') as string,
    username: () => context.globalState.get('USER_ID') as string,
    usertoken: () => context.globalState.get('TOKEN') as string,
    pluginVersion: () => getCurrentPluginVersion(),
  });

  let configurationDidChangeCallbacks: ((key: string, value: any) => void)[] = [];

  logger.log('Configuration loaded:', `locale=${locale}`, `provider=${llm.name}`, `apiKey=${!!apiKey}`, `proxy=${proxy}`);

  const onConfigChanged = (callback: (key: string, value: any) => void) => configurationDidChangeCallbacks.push(callback);

  vscode.workspace.onDidChangeConfiguration((event) => {
    const affectedKeys = ['devpilot.provider', 'devpilot.openaiAPIKey', 'devpilot.proxy', 'devpilot.model'];
    if (affectedKeys.every((key) => !event.affectsConfiguration(key))) {
      return;
    }
    const config = vscode.workspace.getConfiguration('devpilot');
    const providerType = config.get<ProviderType>('provider') || DEFAULT_PROVIDER;
    let proxy = config.get('proxy') as string;
    let apiKey = config.get('openaiAPIKey') as string;
    let model = config.get('model') as string;
    if (providerType === 'ZA') {
      proxy = '';
      apiKey = '';
      model = '';
    }
    logger.log('Configuration changed:', `providerType=${providerType}`);

    logger.debug('apiKey:', maskSensitiveData(apiKey));
    llm = llmProvider.get(providerType, {
      apiKey,
      proxy,
      model,
      stream: true,
      username: () => context.globalState.get('USER_ID') as string,
      usertoken: () => context.globalState.get('TOKEN') as string,
      authType: () => context.globalState.get('AUTH_TYPE') as string,
      pluginVersion: () => getCurrentPluginVersion(),
    });
    logger.log('LLM reloaded:', `llm=${llm.name}`);
  });

  globalConfiguration = {
    locale: () => getVSCodeLocale(),
    llm: () => llm,
    llmLocale: () => vscode.workspace.getConfiguration('devpilot').get('language') as 'Chinese' | 'English',
    username: () => context.globalState.get('USER_NAME') as string,
    onConfigChanged,
  };

  return globalConfiguration;
}
