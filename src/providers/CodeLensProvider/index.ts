import l10n from '@/l10n';
import vscode, { ExtensionContext } from 'vscode';
import { getAllFunctionsRange, SyntaxService } from './syntax';
import { createFullLineRange, selectRange } from '@/utils/vscode-extend';
import { logger } from '@/utils/logger';

const OP_ITEMS = [
  { label: l10n.t('operation.explain_s'), value: 'devpilot.explainCode' },
  { label: l10n.t('operation.fix_s'), value: 'devpilot.fixCode' },
  { label: l10n.t('operation.comment_s'), value: 'devpilot.commentCode' },
  { label: l10n.t('operation.summary_s'), value: 'devpilot.commentMethod' },
  { label: l10n.t('operation.test_s'), value: 'devpilot.generateTest' },
];

export default class CodeLensProvider implements vscode.CodeLensProvider {
  private _context: vscode.ExtensionContext;
  private _commandName = 'devpilot.runOperation';
  private syntaxService!: SyntaxService;

  constructor(context: ExtensionContext) {
    this._context = context;
    this.syntaxService = new SyntaxService();
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
  }

  async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.CodeLens[] | undefined> {
    if (!vscode.workspace.getConfiguration('devpilot').get<boolean>('methodShortcut')) {
      logger.debug('methodShortcut disabled');
      return;
    }
    const ast = await this.syntaxService.parse(document);
    if (!ast) {
      logger.debug('Syntax tree not found');
      return;
    }
    const lenses = getAllFunctionsRange(ast).flatMap((range) => this.buildCodeLense(range));
    logger.debug('CodeLensProvider lenses', lenses);
    return lenses;
  }

  private buildCodeLense(range: vscode.Range) {
    const functionHead = createFullLineRange(range.start.line);
    return OP_ITEMS.map(
      (op, index) =>
        new vscode.CodeLens(functionHead, {
          title: index === 0 ? `$(devpilot-logo-s) ${op.label}` : op.label,
          command: this._commandName,
          arguments: [range, op.value],
        })
    );
  }
}
