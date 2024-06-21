import * as vscode from 'vscode';
import { logger } from './utils/logger';
import Devpilot from './devpilot';
import WelcomeViewProvider from './authentication/welcome';
import LoginController from './authentication/controller';
import statusBar from './statusbar';
import InlineCompletionProvider from './completion/inline/provider';
import CodeLensProvider from './providers/CodeLensProvider';

export function activate(context: vscode.ExtensionContext) {
  logger.setProductionMode(context.extensionMode === vscode.ExtensionMode.Production);
  LoginController.create(context);

  vscode.window.onDidChangeWindowState((event) => {
    if (event.focused) {
      LoginController.instance.updateLoginStatus({ inform: false });
    }
  });

  const devpilot = new Devpilot(context);
  new WelcomeViewProvider(context);

  context.subscriptions.push(
    vscode.window.onDidChangeActiveColorTheme(() => {
      const theme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ? 'dark' : 'light';
      devpilot.onThemeChanged(theme);
    })
  );

  statusBar.create(context);

  new InlineCompletionProvider(context);
  new CodeLensProvider(context);

  logger.debug('Activated');
}

export function deactivate() {}
