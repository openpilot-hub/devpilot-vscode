import l10n from '@/l10n';
import vscode from 'vscode';

export function notifyLogin() {
  const buttons = [l10n.t('login'), l10n.t('dismiss')];
  vscode.window.showWarningMessage(l10n.t('login.fail'), ...buttons).then((res) => {
    if (res === buttons[0]) {
      vscode.commands.executeCommand('devpilot.login');
    }
  });
}
