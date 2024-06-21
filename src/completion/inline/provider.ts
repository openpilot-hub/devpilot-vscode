import vscode, { ExtensionContext } from 'vscode';
import { getCompletions } from '@/services/completion';
import { logger } from '@/utils/logger';
import { sleep } from '@/utils';
import { trackCompletionAcceptance } from '../../services/tracking';
import { getLanguageForCurrentFile } from '../promptContext';
import LoginController from '@/authentication/controller';
import eventsProvider from '@/providers/EventsProvider';

export default class InlineCompletionProvider implements vscode.InlineCompletionItemProvider {
  private _context: vscode.ExtensionContext;
  private _lastTriggerId = 0;
  private _cancelToken?: AbortController;
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
      vscode.commands.registerCommand('devpilot.accept.InlineCompletion', (e) => {
        if (this.lastCompletionItem) {
          logger.debug('Completion item accepted');
          trackCompletionAcceptance(this.lastCompletionItem.messageId, getLanguageForCurrentFile());
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
    logger.debug('provideInlineCompletionItems triggered');

    if (position.line <= 0) return;

    this._lastTriggerId++;
    const triggerId = this._lastTriggerId;
    await sleep(500);

    if (triggerId !== this._lastTriggerId) {
      // Cancel this trigger if there is a new trigger
      return;
    }

    const { token: loginToken } = LoginController.instance.getLoginInfo();
    if (!loginToken) return;

    const config = vscode.workspace.getConfiguration('devpilot');
    const autoComplete = config.get<boolean>('autoCompletion');
    if (!autoComplete) return;

    logger.debug('provideInlineCompletionItems executed!');

    this._cancelToken?.abort();
    const abortController = new AbortController();
    this._cancelToken = abortController;

    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const cursorCharIndex = document.offsetAt(position);
    const reqStart = Date.now();

    eventsProvider.onFetchCompletion.fire('START');
    const res = await getCompletions(
      {
        document: document.getText(),
        filePath: document.uri.fsPath.replace(workspaceRoot!, ''),
        language: document.languageId,
        position: cursorCharIndex!,
        completionType: 'comment',
      },
      abortController.signal
    ).catch((err) => {
      console.error(err);
      return null;
    });
    eventsProvider.onFetchCompletion.fire('END');

    logger.debug('req time costs:', (Date.now() - reqStart) / 1000);
    logger.debug('req response:', res);

    const textToInsert: string = res?.data?.content?.trimStart();
    const messageId = res?.data?.id;

    logger.info('InlineCompletions =>', textToInsert);

    if (!textToInsert) return;

    const completionItem = new vscode.InlineCompletionItem(
      textToInsert,
      new vscode.Range(position, position.translate(0, textToInsert.length)),
      {
        title: 'By DevPilot',
        command: 'devpilot.accept.InlineCompletion',
      }
    );

    this.lastCompletionItem = {
      messageId,
      completionItem,
    };

    return [completionItem];
  }
}
