declare module 'vscode' {
  interface WebviewPanel {
    disposed: boolean;
    chatHandler: LLMChatHandler;
  }
}

import * as fs from 'fs';
import { join } from 'path';
import * as vscode from 'vscode';
import { DevPilotFunctionality, LLMChatHandler } from './completion/typing';
import { buildDevpilotMessages } from './completion/promptBuilder';
import { configurationManager } from './configuration';
import { createAssistantMessage } from './completion/messages';
import { getLanguageForCurrentFile } from './completion/promptContext';
import { logger } from './util/logger';
import { startNewConversation, getCurrentConversation, Conversation } from './conversation/conversation';

const { llm, locale } = configurationManager();

async function streamingBotAnswerIntoConversation(convo: Conversation, panel: vscode.WebviewPanel) {
  convo.addMessage(createAssistantMessage('...'));

  panel.webview.postMessage({
    command: 'RenderChatConversation',
    payload: convo.messages
  });

  let answer;
  try {
    const handler = await llm().chat(convo.messages);
    handler.onText((text) => {
      convo.replaceTextToLastMessage(text, true);
      panel.webview.postMessage({
        command: 'RenderChatConversation',
        payload: convo.messages
      });
    });
    handler.onInterrupted(() => {
      convo.interruptLastMessage();
      panel.webview.postMessage({
        command: 'RenderChatConversation',
        payload: convo.messages
      });
    })
    panel.chatHandler = handler;
    answer = await handler.result();
  } catch (err: any) {
    answer = err.message;
    convo.replaceTextToLastMessage(err.message, false);
  }

  convo.replaceTextToLastMessage(answer, false);

  panel.webview.postMessage({
    command: 'RenderChatConversation',
    payload: convo.messages
  });
}

function renderConversationIntoWebview(convo: Conversation, panel: vscode.WebviewPanel) {
  panel.webview.postMessage({
    command: 'RenderChatConversation',
    payload: convo.messages
  });
}

function getWebviewPanel(context: vscode.ExtensionContext) {
  const htmlPath = vscode.Uri.file(join(context.extensionPath, 'dist', 'index.html'));
  let panel: vscode.WebviewPanel;

  return () => {
    if (!panel || panel.disposed)
      panel = createWebviewPanel();
    return panel;
  };

  function createWebviewPanel() {
    const pan = vscode.window.createWebviewPanel(
      'devpilot',
      'DevPilot',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [htmlPath],
        retainContextWhenHidden: true
      }
    );
    const htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
    pan.webview.html = htmlContent;
    pan.webview.onDidReceiveMessage(async ({ command, payload }) => {
      if (command === 'AppendToConversation') {
        const convo = getCurrentConversation();
        convo.addMessage(payload);
        renderConversationIntoWebview(convo, pan);
        await streamingBotAnswerIntoConversation(convo, pan);
        return;
      }
      if (command === 'InterrupMessageStream') {
        pan.chatHandler?.interrup();
        return;
      }
    })
    pan.onDidDispose(() => {
      pan.disposed = true;
    }, null, context.subscriptions);
    return pan;
  }
}

export function activate(context: vscode.ExtensionContext) {
  logger.setProductionMode(context.extensionMode === vscode.ExtensionMode.Production);
  logger.debug('Activated');

  context.subscriptions.push(vscode.commands.registerCommand('devpilot.explainCode', async () => {
    starConversationOf(DevPilotFunctionality.ExplainCode);
  }));
  context.subscriptions.push(vscode.commands.registerCommand('devpilot.fixBug', async () => {
    starConversationOf(DevPilotFunctionality.FixBug);
  }));
  context.subscriptions.push(vscode.commands.registerCommand('devpilot.generateComment', async () => {
    starConversationOf(DevPilotFunctionality.GenerateComment);
  }));
  context.subscriptions.push(vscode.commands.registerCommand('devpilot.generateTest', async () => {
    starConversationOf(DevPilotFunctionality.GenerateTest);
  }));
  context.subscriptions.push(vscode.commands.registerCommand('devpilot.checkPerformance', async () => {
    starConversationOf(DevPilotFunctionality.CheckPerformance);
  }));
  context.subscriptions.push(vscode.commands.registerCommand('devpilot.codeReview', async () => {
    starConversationOf(DevPilotFunctionality.CodeReview);
  }));

  async function starConversationOf(functionality: DevPilotFunctionality) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const panel = getWebviewPanel(context)();

    if (!panel.visible) {
      panel.reveal(vscode.ViewColumn.Beside, true);
    }

    const convo = startNewConversation(
      buildDevpilotMessages({
        sourceCode: editor.document.getText(editor.selection),
        functionality,
        language: getLanguageForCurrentFile(),
        locale: locale()
      })
    );
    renderConversationIntoWebview(convo, panel);
    await streamingBotAnswerIntoConversation(convo, panel);
  }
}

export function deactivate() { }
