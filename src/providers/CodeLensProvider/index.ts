import l10n from '@/l10n';
import vscode, { ExtensionContext } from 'vscode';
import { getAllFunctionsRange } from './syntax';
import { createFullLineRange, selectRange } from '@/utils/vscode-extend';
import { logger } from '@/utils/logger';
import SyntaxService from '@/services/syntax';

const OP_ITEMS = [
  { label: l10n.t('operation.explain_s'), desc: l10n.t('operation.explain'), value: 'devpilot.explainCode' },
  { label: l10n.t('operation.fix_s'), desc: l10n.t('operation.fix'), value: 'devpilot.fixCode' },
  { label: l10n.t('operation.comment_s'), desc: l10n.t('operation.comment'), value: 'devpilot.commentCode' },
  { label: l10n.t('operation.summary_s'), desc: l10n.t('operation.summary'), value: 'devpilot.commentMethod' },
  { label: l10n.t('operation.test_s'), desc: l10n.t('operation.test'), value: 'devpilot.generateTest' },
];

export default class CodeLensProvider implements vscode.CodeLensProvider {
  private _pickActionCommandName = 'devpilot.codelens.actionPicker.show';
  private _commandName = 'devpilot.codelens.runOperation';
  private _context: vscode.ExtensionContext;

  constructor(context: ExtensionContext) {
    this._context = context;
    this.initialize();
  }

  initialize() {
    this._context.subscriptions.push(
      vscode.languages.registerCodeLensProvider(
        { pattern: '**/*.{ts,js,tsx,jsx,java,py,go,rust,css,dart,html,kotlin,scala,swift,cpp,vue}' },
        this
      )
    );
    this._context.subscriptions.push(
      vscode.commands.registerCommand(this._commandName, (range, command) => {
        selectRange(range);
        vscode.commands.executeCommand(command);
      })
    );
    this._context.subscriptions.push(
      vscode.commands.registerCommand(this._pickActionCommandName, (range) => {
        selectRange(range);
        this.showPicker();
      })
    );
  }

  async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.CodeLens[] | undefined> {
    const displayMode = vscode.workspace.getConfiguration('devpilot').get<string>('methodShortcut');
    if (displayMode === 'hidden') {
      logger.debug('methodShortcut disabled');
      return;
    }
    if (document.lineCount > 5000) {
      logger.debug('File too large');
      return;
    }
    const ast = await SyntaxService.instance.parse(document.getText(), document.languageId);
    if (!ast) {
      logger.debug('Syntax tree not found');
      return;
    }
    const lenses = getAllFunctionsRange(ast).flatMap((range) => this.buildCodeLense(range, displayMode));
    // logger.debug('CodeLensProvider lenses', lenses.length);
    return lenses;
  }

  private buildCodeLense(range: vscode.Range, mode?: string) {
    const functionHead = createFullLineRange(range.start.line);
    if (mode === 'group') {
      return [
        new vscode.CodeLens(functionHead, {
          title: `$(devpilot-logo-s)$(chevron-down)`,
          command: this._pickActionCommandName,
          arguments: [range],
        }),
      ];
    }
    return OP_ITEMS.map(
      (op, index) =>
        new vscode.CodeLens(functionHead, {
          title: index === 0 ? `$(devpilot-logo-s) ${op.label}` : op.label,
          command: this._commandName,
          arguments: [range, op.value],
        })
    );
  }

  private showPicker() {
    vscode.window
      .showQuickPick(
        OP_ITEMS.map((op) => op.desc),
        { placeHolder: l10n.t('operation.quickpick.placeholder') }
      )
      .then((selected) => {
        const op = OP_ITEMS.find((op) => op.desc === selected);
        op && vscode.commands.executeCommand(op.value);
      });
  }
}
