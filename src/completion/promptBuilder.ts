import { logger } from '@/util/logger';
import { createSystemMessage, createUserMessage } from './messages';
import * as prompts from './prompts';
import { DevPilotFunctionality, Locale, Language, Message } from './typing';

function wrapInCodeblock(lang: string, code: string) {
  return `\`\`\`${lang}\n${code}\n\`\`\``;
}

export function buildDevpilotMessages({
  sourceCode,
  functionality,
  language,
  locale
}: {
  sourceCode: string,
  functionality: DevPilotFunctionality,
  language: Language,
  locale: Locale,
}): Message[] {
  
  const userPrompt =
    prompts.codeExpert[functionality]
      .replace('{{CODE}}', wrapInCodeblock(language, sourceCode));
  
  const langPrompt = prompts.language.replace('{{LOCALE}}', locale);
  const prompt = userPrompt + '\n' + langPrompt;
  
  logger.debug('[Prompt]', prompt);
  
  return [
    createSystemMessage(prompts.codeExpert.systemPrompt),
    createUserMessage(prompt),
  ]
}
