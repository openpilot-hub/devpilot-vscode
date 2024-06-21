import * as vscode from 'vscode';

export function getSelectionInfo(document: vscode.TextDocument, selection: vscode.Selection): string {
  const filePath = document.fileName;

  const relativeFilePath = vscode.workspace.asRelativePath(filePath);

  const totalLines = document.lineCount;
  const startLine = selection.start.line + 1; // +1 to make it 1-based index
  const endLine = selection.end.line + 1; // +1 to make it 1-based index

  const linesAbove = startLine - 1;
  const linesBelow = totalLines - endLine;

  let selectedText = '';
  for (let i = startLine - 1; i < endLine; i++) {
    selectedText += `${i + 1}: ${document.lineAt(i).text}\n`;
  }

  const output = `[File: ${relativeFilePath} (${totalLines} lines total)]\n(${linesAbove} lines above)\n${selectedText}(${linesBelow} lines below)`;

  return output;
}