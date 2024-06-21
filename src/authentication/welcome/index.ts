import vscode from 'vscode';
import html from './view.html';
import l10n from '@/l10n';

export default class WelcomeViewProvider implements vscode.WebviewViewProvider {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.initialize();
  }

  initialize() {
    this.context.subscriptions.push(vscode.window.registerWebviewViewProvider('devpilot-welcome', this));
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    webviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
    };

    const logo = vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'logo.png');
    const logoSrc = webviewView.webview.asWebviewUri(logo);

    webviewView.webview.html = html.replace('{LOGO}', logoSrc).replace('{welcome}', l10n.t('welcome')).replace('{login}', l10n.t('login'));
  }
}
