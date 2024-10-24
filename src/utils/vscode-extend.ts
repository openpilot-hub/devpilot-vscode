/**
 * Encapsulate some VSCode APIs to simplify usage
 */

import vscode from 'vscode';

export function createFullLineRange(row: number) {
  const start = new vscode.Position(row, 0);
  const end = new vscode.Position(row, Number.MAX_SAFE_INTEGER);
  return new vscode.Range(start, end);
}

export function selectRange(range: vscode.Range) {
  let editor = vscode.window.activeTextEditor;
  if (editor) {
    editor.selection = new vscode.Selection(range.start, range.end);
  }
}

export function getCurrentPluginVersion() {
  const extension = vscode.extensions.getExtension('Zhongan.devpilot');
  return extension?.packageJSON?.version || '0.0.1';
}

export function getWorkspaceRoot(fsPath?: string): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders?.length) {
    return undefined;
  }

  fsPath = fsPath || vscode.window.activeTextEditor?.document.uri.fsPath;
  if (fsPath) {
    for (const folder of workspaceFolders) {
      if (fsPath.startsWith(folder.uri.fsPath)) {
        return folder.uri.fsPath;
      }
    }
  }

  return workspaceFolders[0].uri.fsPath;
}
