import { join } from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { getCurrentConversation, startNewConversation } from '@/conversation/conversation';
import { createAssistantMessage, createDividerMessage, createSystemMessage } from '@/completion/messages';
import { buildDevpilotMessages, buildDevpilotSystemMessage, messageWithCodeblock } from '@/completion/promptBuilder';
import { ChatMessage, DevPilotFunctionality, LLMChatHandler } from '@/completion/typing';
import { getLanguageForCurrentFile } from './completion/promptContext';
import { Configuration, configuration } from './configuration';
import { createUserMessage } from './completion/messages';
import { CodeReference } from './completion/typing';
import l10n from './l10n';
import { getLanguageForFileExtension } from './utils/mapping';
import { getRepositoryName } from './utils/git';
import { isRepoEmbedded } from './services/rag';
import { logger } from './utils/logger';
import { trackCodeAction, trackLiking } from './services/tracking';
import eventsProvider from '@/providers/EventsProvider';
import { getCurrentPluginVersion } from './utils/vscode-extend';

export enum PluginCommand {
  LocaleChanged = 'LocaleChanged',
  ThemeChanged = 'ThemeChanged',
  ConfigurationChanged = 'ConfigurationChanged',
  RenderChatConversation = 'RenderChatConversation',
  LikeMessage = 'LikeMessage',
  DislikeMessage = 'DislikeMessage',
  DeleteMessage = 'DeleteMessage',
  RegenerateMessage = 'RegenerateMessage',
  AppendToConversation = 'AppendToConversation',
  InterruptChatStream = 'InterruptChatStream',
  GotoSelectedCode = 'GotoSelectedCode',
  InsertCodeAtCaret = 'InsertCodeAtCaret',
  ReplaceSelectedCode = 'ReplaceSelectedCode',
  CreateNewFile = 'CreateNewFile',
  ClearChatHistory = 'ClearChatHistory',
  FixCode = 'FixCode',
  ExplainCode = 'ExplainCode',
  CommentCode = 'CommentCode',
  TestCode = 'TestCode',
  CopyCode = 'CopyCode',
  OpenFile = 'OpenFile',
  CheckCodePerformance = 'CheckCodePerformance',
  PresentCodeEmbeddedState = 'PresentCodeEmbeddedState',
}

export let globalDevpilot: Devpilot | undefined = undefined;

export default class Devpilot implements vscode.WebviewViewProvider {
  private _context: vscode.ExtensionContext;
  private extensionUri: vscode.Uri;
  private view: vscode.WebviewView | null;
  private chatHandler?: LLMChatHandler;
  private config: Configuration;
  private repoName: string = '';
  private repoEmbedded: boolean = false;

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
    this.extensionUri = context.extensionUri;
    globalDevpilot = this;
    this.view = null;
    this.config = configuration(context);
    this.config.onConfigChanged(this.onConfigChanged.bind(this));
    this.initialize();
  }

  async initialize() {
    logger.debug('devpilot.initialize');

    eventsProvider.onLogin.event((status) => {
      if (status === 1) {
        const loginType = this._context.globalState.get('LOGIN_TYPE') as string;
        const loginTypeName = { gzh: '微信公众号', za: '众安保险', zati: 'ZATI' }[loginType];
        this.appendChatMessage(
          createAssistantMessage({
            content: `[C]${loginTypeName} ${l10n.t('login.success')}: ${this._context.globalState.get('USER_NAME')}`,
          })
        );
      } else {
        this.clearAllChatHistory();
      }
    });

    this._context.subscriptions.push(
      vscode.window.registerWebviewViewProvider('devpilot-chat', this, {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      })
    );

    this.registerCommands(this._context);

    this.repoName = await getRepositoryName();
    logger.debug('repoName', this.repoName);
    if (this.config.llm().name === 'ZA') {
      this.repoEmbedded = await isRepoEmbedded(this.repoName);
    } else {
      logger.debug("Don't check repo embedding for non-ZA provider");
      this.repoEmbedded = false;
    }
    logger.debug('repoEmbedded', this.repoEmbedded);
  }

  onThemeChanged(theme: string) {
    this.postPluginMessage({
      command: PluginCommand.ThemeChanged,
      payload: { theme },
    });
  }

  onConfigChanged(key: string, value: any) {
    if (key === 'locale') {
      this.postPluginMessage({
        command: PluginCommand.LocaleChanged,
        payload: { locale: value },
      });
    } else if (key === 'username') {
      this.postPluginMessage({
        command: PluginCommand.ConfigurationChanged,
        payload: { username: value },
      });
    }
  }

  registerCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.commands.registerCommand('devpilot.startup', async () => {
        await this.reveal();
        this.startNewConversatin();
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand('devpilot.explainCode', async () => {
        this.starConversationOf(DevPilotFunctionality.ExplainCode);
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand('devpilot.fixBug', async () => {
        this.starConversationOf(DevPilotFunctionality.FixBug);
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand('devpilot.generateComment', async () => {
        this.starConversationOf(DevPilotFunctionality.GenerateComment);
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand('devpilot.generateTest', async () => {
        this.starConversationOf(DevPilotFunctionality.GenerateTest);
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand('devpilot.checkPerformance', async () => {
        this.starConversationOf(DevPilotFunctionality.CheckPerformance);
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand('devpilot.codeReview', async () => {
        this.starConversationOf(DevPilotFunctionality.CodeReview);
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand('devpilot.commentCode', async () => {
        this.starConversationOf(DevPilotFunctionality.CommentCode);
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand('devpilot.summaryCode', async () => {
        this.starConversationOf(DevPilotFunctionality.SummaryCode);
      })
    );
  }

  async reveal() {
    if (!this.view) {
      await vscode.commands.executeCommand('devpilot-chat.focus');
      return;
    }
    if (!this.view.visible) {
      this.view.show(true);
    }
  }

  postPluginMessage(msg: { command: PluginCommand; payload: any }) {
    this.view?.webview.postMessage(msg);
  }

  startNewConversatin() {
    startNewConversation();
    this.renderConversation();
  }

  startNewConversatinWithChatMessage(initMessages: ChatMessage[]) {
    startNewConversation(initMessages);
    this.renderConversation();
    this.streamingBotAnswerIntoConversation();
  }

  async starConversationOf(functionality: DevPilotFunctionality) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found');
      return;
    }

    const sourceCode = editor.document.getText(editor.selection);

    if (!sourceCode) {
      vscode.window.showErrorMessage('No code selected');
      return;
    }

    await this.reveal();

    const codeRef: CodeReference = {
      fileUrl: editor.document.uri.toString(),
      fileName: editor.document.uri.path.split('/').pop() || '',
      sourceCode,
      selectedStartLine: editor.selection.start.line + 1,
      selectedEndLine: editor.selection.end.line + 1,
    };

    const initMessages = buildDevpilotMessages({
      codeRef,
      functionality,
      language: getLanguageForCurrentFile(),
      llmLocale: this.config.llmLocale(),
    });

    this.startNewConversatinWithChatMessage(initMessages);
  }

  public async appendChatMessage(msg: ChatMessage) {
    const convo = getCurrentConversation();
    convo.addMessage(msg);
    this.renderConversation();
  }

  deleteChatMessage(msg: ChatMessage) {
    const convo = getCurrentConversation();
    const currMsg = convo.getMessageByID(msg.id);
    if (!currMsg) {
      return;
    }
    if (msg.role !== 'user') {
      return;
    }
    const deleted = convo.deletePairMessage(msg);
    if (!deleted) {
      return;
    }
    const [msg1, msg2] = deleted;
    if (msg1.streaming || msg2.streaming) {
      this.chatHandler?.interrupt();
    }
    this.renderConversation();
  }

  regenerateChatMessage(msg: ChatMessage) {
    const convo = getCurrentConversation();
    const currMsg = convo.getMessageByID(msg.id);
    if (!currMsg) {
      return;
    }
    if (msg.role !== 'assistant') {
      return;
    }
    if (currMsg.streaming) {
      this.chatHandler?.interrupt();
    }
    convo.deleteMessage(msg);
    this.renderConversation();
    this.streamingBotAnswerIntoConversation();
  }

  clearChatHistory() {
    const convo = getCurrentConversation();
    if (!convo.lastMessage || convo.lastMessage.role === 'divider') {
      return;
    }
    convo.addMessage(createDividerMessage());
    this.renderConversation();
  }

  clearAllChatHistory() {
    const convo = getCurrentConversation();
    convo.clearAllMessages();
  }

  renderConversation() {
    const convo = getCurrentConversation();

    let renderMessages = convo.messages.filter((msg) => msg.role !== 'system');
    renderMessages = renderMessages.map((msg) => ({
      ...msg,
      content: msg.content.startsWith('[C]') ? msg.content.replace('[C]', '') : msg.content,
    }));

    this.view?.webview.postMessage({
      command: PluginCommand.RenderChatConversation,
      payload: renderMessages,
    });
  }

  async streamingBotAnswerIntoConversation() {
    const convo = getCurrentConversation();

    if (!convo.lastMessage) {
      return;
    }

    const isRAG = convo.lastMessage.content.includes('@repo');
    console.log('isRAG', isRAG, convo.lastMessage.content, this.repoName, this.repoEmbedded);

    if (isRAG) {
      if (!convo.lastMessageIsFirstInSession()) {
        convo.insertBefore(convo.lastMessage, createDividerMessage());
      }
      convo.lastMessage.prompt = convo.lastMessage.content.replace('@repo', '');
    }

    convo.addMessage(createAssistantMessage({ content: '...', prompt: '' }));
    this.renderConversation();

    let answer;

    try {
      const msgs = convo.lastSessionMessages;

      // Make sure the first message is a system message, either the one we added or the one from the previous session
      if (msgs[0].role !== 'system') {
        if (convo.messages[0].role === 'system') {
          msgs.unshift(convo.messages[0]);
        } else {
          if (isRAG) {
            msgs.unshift(createSystemMessage('You are awesome'));
          } else {
            msgs.unshift(buildDevpilotSystemMessage());
          }
        }
      }

      const llmMsgs = msgs.filter((msg) => !msg.content.startsWith('[C]'));

      const handler = await this.config.llm().chat(llmMsgs, isRAG ? { repo: this.repoName } : undefined);

      handler.onText((text, { id }) => {
        convo.replaceToLastMessage({ id, content: text, prompt: text }, true);
        this.renderConversation();
      });

      handler.onInterrupted(() => {
        convo.interruptLastMessage();
        this.renderConversation();
      });

      this.chatHandler = handler;
      answer = await handler.result();

      convo.replaceToLastMessage({ content: answer, prompt: answer }, false);
      this.renderConversation();
    } catch (error: any) {
      const err = error as Error;
      console.error('LLM Error', err);
      if (/401/.test(err.message)) {
        const failText = `[C]${l10n.t('login.fail')}`;
        convo.replaceToLastMessage({ content: failText, prompt: failText });
        convo.addMessage(createUserMessage({ content: `[C]${l10n.t('chat.login')}` }));
        this.renderConversation();
        const buttons = [l10n.t('login'), l10n.t('dismiss')];
        vscode.window.showWarningMessage(l10n.t('login.fail'), ...buttons).then((res) => {
          if (res === buttons[0]) {
            vscode.commands.executeCommand('devpilot.login');
          }
        });
      } else {
        convo.replaceToLastMessage({ content: err.message });
        this.renderConversation();
      }
    }
  }

  interruptChatStream() {
    this.chatHandler?.interrupt();
  }

  async handleCommandFromWebview({ command, payload: msg }: { command: string; payload: any }) {
    logger.debug('Receive message =>', command, JSON.stringify(msg, null, 2));
    if (command === PluginCommand.OpenFile) {
      // open file in vscode
      if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder found!');
        return;
      }
      const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath; // 获取第一个工作区文件夹的路径
      const filePath = vscode.Uri.file(`${workspaceFolder}/${msg.content}`);
      try {
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
      } catch (error: any) {
        vscode.window.showErrorMessage('Failed to open file: ' + error.message);
      }
      return;
    }
    if (command === PluginCommand.AppendToConversation) {
      // if selected code is not empty, add it to the conversation
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.getText(editor.selection)) {
        msg.content = messageWithCodeblock(msg.content, editor.document.getText(editor.selection), getLanguageForCurrentFile());
      }
      if (msg.role === 'user') {
        const convo = getCurrentConversation();
        msg.prompt = msg.prompt || msg.content;
        convo.addMessage(msg);
        this.renderConversation();
        await this.streamingBotAnswerIntoConversation();
      }
      return;
    }
    if (command === PluginCommand.InterruptChatStream) {
      this.interruptChatStream();
      return;
    }
    if (command === PluginCommand.DeleteMessage) {
      this.deleteChatMessage(msg);
      return;
    }
    if (command === PluginCommand.RegenerateMessage) {
      this.regenerateChatMessage(msg);
      return;
    }
    if (command === PluginCommand.ClearChatHistory) {
      this.clearChatHistory();
      return;
    }
    if (command === PluginCommand.GotoSelectedCode) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const startLine = msg.selectedStartLine - 1;
        const startCharacter = 0;
        const endLine = msg.selectedEndLine;
        const endCharacter = editor.document.lineAt(endLine).text.length;
        const startPosition = new vscode.Position(startLine, startCharacter);
        const endPosition = new vscode.Position(endLine, endCharacter);

        const selection = new vscode.Selection(startPosition, endPosition);

        editor.selection = selection;

        editor.revealRange(selection, vscode.TextEditorRevealType.Default);
      }
      return;
    }
    if (command === PluginCommand.CopyCode) {
      if (msg.role === 'assistant') {
        trackCodeAction('COPY', msg.messageId, msg.content, msg.language);
      }
      return;
    }
    if (command === PluginCommand.LikeMessage) {
      logger.debug('trackLiking', msg);
      trackLiking(msg.id, true);
      return;
    }
    if (command === PluginCommand.DislikeMessage) {
      logger.debug('trackLiking', msg, false);
      trackLiking(msg.id, false);
      return;
    }
    if (command === PluginCommand.InsertCodeAtCaret) {
      logger.debug(PluginCommand.InsertCodeAtCaret, msg);
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.edit((editBuilder) => {
          editBuilder.insert(editor.selection.active, msg.content);
        });
      }
      trackCodeAction('INSERT', msg.messageId, msg.content, msg.language);
      return;
    }
    if (command === PluginCommand.ReplaceSelectedCode) {
      logger.debug(PluginCommand.ReplaceSelectedCode, msg);
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.edit((editBuilder) => {
          editBuilder.replace(editor.selection, msg.content);
        });
      }
      trackCodeAction('REPLACE', msg.messageId, msg.content, msg.language);
      return;
    }
    if (command === PluginCommand.CreateNewFile) {
      logger.debug(PluginCommand.CreateNewFile, msg);
      const document = await vscode.workspace.openTextDocument({
        language: getLanguageForFileExtension(msg.lang),
        content: msg.content,
      });
      await vscode.window.showTextDocument(document, {
        preview: false,
        viewColumn: vscode.ViewColumn.One,
      });
      trackCodeAction('NEW_FILE', msg.messageId, msg.content, msg.language);
      return;
    }
    if (command === PluginCommand.ExplainCode) {
      this.starConversationOf(DevPilotFunctionality.ExplainCode);
      return;
    }
    if (command === PluginCommand.FixCode) {
      this.starConversationOf(DevPilotFunctionality.FixBug);
      return;
    }
    if (command === PluginCommand.CommentCode) {
      this.starConversationOf(DevPilotFunctionality.GenerateComment);
      return;
    }
    if (command === PluginCommand.TestCode) {
      this.starConversationOf(DevPilotFunctionality.GenerateTest);
      return;
    }
    if (command === PluginCommand.CheckCodePerformance) {
      this.starConversationOf(DevPilotFunctionality.CheckPerformance);
      return;
    }
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;
    this.view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(join(this.extensionUri.fsPath, 'dist', 'index.html'))],
    };
    this.getHtmlForWebview().then((html) => {
      webviewView.webview.html = html;
      webviewView.webview.onDidReceiveMessage(this.handleCommandFromWebview.bind(this));
      setTimeout(() => {
        this.postPluginMessage({
          command: PluginCommand.ConfigurationChanged,
          payload: { locale: this.config.locale() },
        });
        this.postPluginMessage({
          command: PluginCommand.ConfigurationChanged,
          payload: { username: this.config.username() },
        });
      }, 500);
      setTimeout(() => {
        logger.debug('PresentCodeEmbeddedState', this.repoEmbedded, this.repoName);
        this.postPluginMessage({
          command: PluginCommand.PresentCodeEmbeddedState,
          payload: {
            repoEmbedded: this.repoEmbedded,
            repoName: this.repoName,
          },
        });
      }, 2000);
    });
  }

  private async getHtmlForWebview(): Promise<string> {
    const htmlPath = vscode.Uri.file(join(this.extensionUri.fsPath, 'dist', 'index.html'));
    let htmlContent = await fs.promises.readFile(htmlPath.fsPath, 'utf8');
    htmlContent = htmlContent.replace('{{SERAPH_ENV}}', process.env.NODE_ENV === 'development' ? 'test' : 'prd');
    htmlContent = htmlContent.replace('{{SERAPH_VERSION}}', getCurrentPluginVersion());
    htmlContent = htmlContent.replace('{{SERAPH_IDE}}', 'vscode');
    return htmlContent;
  }
}
