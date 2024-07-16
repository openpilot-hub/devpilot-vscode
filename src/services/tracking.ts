import request, { ZAPI } from '@/utils/request';
import { TELEMETRY_ON } from '@/env';

// 对话 赞（true）、踩 (false)
export function trackLiking(messageId: string, like: boolean) {
  request().put(ZAPI('tracking', `/conversation-messages/${messageId}`), {
    agreeStatus: like,
  });
}

// 对话接受 actionType主要是webview上markdown上面的按钮，操作有： INSERT / REPLACE / NEW_FILE / COPY
export function trackCodeAction(
  actionType: 'INSERT' | 'REPLACE' | 'NEW_FILE' | 'COPY',
  messageId: string,
  content: string,
  language: string
) {
  if (TELEMETRY_ON) {
    request().put(ZAPI('tracking', `/conversation-messages/${messageId}/accepted`), {
      acceptedLines: content,
      language,
      actionType,
    });
  }
}

// 补全接受 主要是TAB的事件
export function trackCompletionAcceptance(messageId: string, language: string) {
  if (TELEMETRY_ON) {
    request().put(ZAPI('tracking', `/completion-messages/${messageId}`), {
      language,
    });
  }
}
