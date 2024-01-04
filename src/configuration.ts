import * as vscode from 'vscode';
import { Locale, ProviderType } from './completion/typing';
import llmProvider from './completion/llm/provider';
import { logger } from './util/logger';

export function configurationManager() {
  const config = vscode.workspace.getConfiguration('devpilot');
  let locale = config.get('language') as Locale;
  let apiKey = config.get('openaiAPIKey') as string;
  let proxy = config.get('proxy') as string;
  let llm = llmProvider.get(config.get('provider') as ProviderType, {apiKey, proxy, stream: true});

  logger.log('Configuration loaded:', `lang=${locale}`, `provider=${llm.name}`, `apiKey=${!!apiKey}`, `proxy=${proxy}`);

  vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('devpilot.language')) {
      locale = vscode.workspace.getConfiguration('devpilot').get('language') as Locale;
      logger.log('Configuration reloaded:', `lang=${locale}`);
    }
    if (event.affectsConfiguration('devpilot.provider') || event.affectsConfiguration('devpilot.openaiAPIKey')) {
      const providerType = config.get('provider') as ProviderType;
      const apiKey = vscode.workspace.getConfiguration('devpilot').get('openaiAPIKey') as string;
      llm = llmProvider.get(providerType, {apiKey, proxy, stream: true});
      logger.log('Configuration reloaded:', `llm=${llm.name}`);
    }
  });

  return {
    locale: () => locale,
    llm: () => llm,
  }
}