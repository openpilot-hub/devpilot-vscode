import vscode, { ExtensionContext } from 'vscode';
import { getCompletions } from '@/services/completion';
import { logger } from '@/utils/logger';
import { sleep } from '@/utils';
import { trackCompletionAcceptance } from '../../services/tracking';
import LoginController from '@/authentication/controller';
import eventsProvider from '@/providers/EventsProvider';
import { getLanguageForMarkdown } from '@/utils/mapping';
import { AUTH_ON } from '@/env';
import { checkingNetwork } from '@/utils/network';

export default class InlineCompletionProvider implements vscode.InlineCompletionItemProvider {
  private _context: vscode.ExtensionContext;
  private _lastTriggerId = 0;
  private _cancelToken?: AbortController;
  private _lockCompletion?: boolean = false;
  private lastCompletionItem: {
    messageId: string;
    completionItem: vscode.InlineCompletionItem;
  } | null = null;

  constructor(context: ExtensionContext) {
    this._context = context;
    this.lastCompletionItem = null;
    this.initialize();
  }

  initialize() {
    this._context.subscriptions.push(vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, this));
    this._context.subscriptions.push(
      vscode.commands.registerCommand('devpilot.inline.completion.accept', (e) => {
        if (this.lastCompletionItem) {
          logger.debug('=== Completion item accepted');
          this.lockMilliseconds();
          trackCompletionAcceptance(
            this.lastCompletionItem.messageId,
            getLanguageForMarkdown(vscode.window.activeTextEditor!.document.languageId)
          );
          this.lastCompletionItem = null;
        }
      })
    );
  }

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionList | vscode.InlineCompletionItem[] | undefined> {
    logger.debug('=== provideInlineCompletionItems triggered');

    if (position.line <= 0 || this._lockCompletion) return;

    this._lastTriggerId++;
    const triggerId = this._lastTriggerId;
    await sleep(1000);

    if (triggerId !== this._lastTriggerId) {
      // Cancel this trigger if there is a new trigger
      return;
    }

    if (AUTH_ON) {
      const { token: loginToken } = LoginController.instance.getLoginInfo();
      if (!loginToken) return;
    }

    const config = vscode.workspace.getConfiguration('devpilot');
    const autoComplete = config.get<boolean>('autoCompletion');
    if (!autoComplete) return;

    if (context.triggerKind === 1) {
      const lineText = document.lineAt(position.line).text;
      const canTrigger = /\{|\s|\n|\r/.test(lineText[position.character - 1]);
      if (!canTrigger) return;
    }

    logger.debug('=== provideInlineCompletionItems executed!');

    this._cancelToken?.abort();
    const abortController = new AbortController();
    this._cancelToken = abortController;

    token.onCancellationRequested(() => {
      this._cancelToken?.abort();
    });

    const workspace = vscode.workspace.workspaceFolders?.[0];
    const workspaceRoot = workspace?.uri.path;
    const workspaceName = workspace?.name;
    const cursorCharIndex = document.offsetAt(position);
    const reqStart = Date.now();

    eventsProvider.onFetchCompletion.fire('START');
    const res = await getCompletions(
      {
        document: document.getText(),
        filePath: workspaceName + document.uri.path.replace(workspaceRoot!, ''),
        language: document.languageId,
        position: cursorCharIndex!,
        completionType: 'comment',
      },
      abortController.signal
    ).catch((err) => {
      console.error(err);
      const { authType } = LoginController.instance.getLoginInfo();
      checkingNetwork(authType!);
      return null;
    });
    eventsProvider.onFetchCompletion.fire('END');

    logger.info('req time costs:', (Date.now() - reqStart) / 1000);
    logger.info('req response:', res?.data);

    const textToInsert: string = res?.data?.content?.trimStart();
    const messageId = res?.data?.id;

    logger.info('InlineCompletions =>', textToInsert);

    if (!textToInsert) return;

    const completionItem = new vscode.InlineCompletionItem(
      textToInsert,
      new vscode.Range(position, position.translate(0, textToInsert.length)),
      {
        title: 'By DevPilot',
        command: 'devpilot.inline.completion.accept',
      }
    );

    this.lastCompletionItem = {
      messageId,
      completionItem,
    };

    return [completionItem];
  }

  lockMilliseconds(milliseconds: number = 500) {
    this._lockCompletion = true;
    setTimeout(() => {
      this._lockCompletion = false;
    }, milliseconds);
  }
}
