import { configuration } from '@/configuration';
import { logger } from '@/utils/logger';
import { createSystemMessage, createUserMessage } from './messages';
import * as prompts from './prompts';
import { DevPilotFunctionality, Language, ChatMessage, CodeReference } from './typing';
import l10n from '@/l10n';

function wrapInCodeblock(lang: string, code: string) {
  return `\`\`\`${lang}\n${code}\n\`\`\``;
}

export function buildDevpilotSystemMessage() {
  return createSystemMessage(
    prompts.codeExpert.systemPrompt
      .replace('{{LOCALE}}', configuration().llmLocale())
      .replace('{{TIME}}', new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString())
  );
}

export function messageByFunctionality(functionality: DevPilotFunctionality): string {
  return {
    welcome: 'Welcome',
    explainCode: l10n.t('operation.explain'),
    fixBug: l10n.t('operation.fix'),
    generateComment: l10n.t('operation.comment'),
    generateTest: l10n.t('operation.test'),
    checkPerformance: l10n.t('operation.performance'),
    codeReview: l10n.t('operation.review'),
    commentCode: l10n.t('operation.comment_s'),
    summaryCode: l10n.t('operation.summary'),
  }[functionality];
}

type DevpilotMessageOptions = {
  codeRef: CodeReference;
  functionality: DevPilotFunctionality;
  language: Language;
  llmLocale: 'Chinese' | 'English';
};

export function buildDevpilotMessages({ codeRef, functionality, language, llmLocale }: DevpilotMessageOptions): ChatMessage[] {
  const userPrompt = prompts.codeExpert[functionality].replace('{{CODE}}', wrapInCodeblock(language, codeRef.sourceCode));

  const langPrompt = prompts.languages[llmLocale] || prompts.languages.Chinese;
  const prompt = userPrompt + '\n\n' + langPrompt;

  logger.debug('[Prompt]', prompt);

  return [
    buildDevpilotSystemMessage(),
    createUserMessage({
      prompt,
      content: messageByFunctionality(functionality),
      codeRef,
    }),
  ];
}

export function messageWithCodeblock(message: string, code: string, language: string) {
  return wrapInCodeblock(language, code) + '\n\n' + message;
}
