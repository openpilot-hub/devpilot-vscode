import { createUserMessage } from './messages';
import { DevPilotFunctionality, ChatMessage, CodeReference } from '../typing';
import l10n from '@/l10n';

function wrapInCodeblock(lang: string, code: string) {
  return `\`\`\`${lang}\n${code}\n\`\`\``;
}

/**
 * 获取命令在对话窗口显示的文字，例：Explain this
 * @param functionality
 * @returns
 */
export function messageByFunctionality(functionality: DevPilotFunctionality): string {
  return {
    EXPLAIN_CODE: l10n.t('operation.explain'),
    FIX_CODE: l10n.t('operation.fix'),
    GENERATE_COMMENTS: l10n.t('operation.comment'),
    GENERATE_TESTS: l10n.t('operation.test'),
    CHECK_PERFORMANCE: l10n.t('operation.performance'),
    REVIEW_CODE: l10n.t('operation.review'),
    COMMENT_METHOD: l10n.t('operation.summary'),
    GENERATE_COMMIT: '',
    OPEN_CAT: '',
    REFERENCE_CODE: '',
    PURE_CHAT: '',
  }[functionality];
}

type DevpilotMessageOptions = {
  codeRef: CodeReference;
  functionality: DevPilotFunctionality;
  /**
   * 文档语言
   */
  language: string;
  /**
   * 用户语言
   */
  llmLocale: 'Chinese' | 'English';
};

export function buildDevpilotMessages({ codeRef, language, functionality }: DevpilotMessageOptions): ChatMessage[] {
  const newCodeRef = { ...codeRef };
  if (newCodeRef.sourceCode) {
    newCodeRef.sourceCode = wrapInCodeblock(language, codeRef.sourceCode);
  }
  return [
    createUserMessage({
      content: messageByFunctionality(functionality),
      codeRef: newCodeRef,
      commandType: functionality,
    }),
  ];
}

export function messageWithCodeblock(message: string, code: string, language: string) {
  return wrapInCodeblock(language, code) + '\n\n' + message;
}
