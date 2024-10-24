import { createUserMessage } from './messages';
import { DevPilotFunctionality, ChatMessage, CodeReference } from '../typing';
import l10n from '@/l10n';
import { wrapInCodeblock } from '@/utils';

/**
 * 获取命令在对话窗口显示的文字，例：Explain this
 * @param functionality
 * @returns
 */
export function messageByFunctionality(functionality: DevPilotFunctionality) {
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
    CODE_PREDICTION: '',
  }[functionality];
}

export const UserContentMapperForRecall: Record<string, string> = {
  EXPLAIN_CODE: 'Explain the code',
  FIX_CODE: 'Fixing the code',
  GENERATE_COMMENTS: 'Generate in-line comments',
  GENERATE_TESTS: 'Generate unit tests',
  COMMENT_METHOD: 'Generate documentation comments',
};

type DevpilotMessageOptions = {
  codeRef: CodeReference;
  functionality: DevPilotFunctionality;
  /**
   * document language
   */
  // language: string;
  /**
   * user language
   */
  // llmLocale: 'Chinese' | 'English';
};

// export function buildDevpilotMessages({ codeRef, language, functionality }: DevpilotMessageOptions): ChatMessage[] {
//   const newCodeRef = { ...codeRef };
//   if (newCodeRef.sourceCode) {
//     newCodeRef.sourceCode = wrapInCodeblock(language, codeRef.sourceCode);
//   }
//   return [
//     createUserMessage({
//       content: messageByFunctionality(functionality),
//       codeRef: newCodeRef,
//       commandType: functionality,
//     }),
//   ];
// }

export function buildRecallMessage({ codeRef, functionality }: DevpilotMessageOptions): ChatMessage {
  return createUserMessage({
    content: UserContentMapperForRecall[functionality] || UserContentMapperForRecall.EXPLAIN_CODE,
    codeRef: codeRef,
    commandType: functionality,
  });
}

export function messageWithCodeblock(message: string, code: string, language: string) {
  return wrapInCodeblock(language, code) + '\n\n' + message;
}
