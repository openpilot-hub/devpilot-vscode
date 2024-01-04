import * as vscode from 'vscode';
import { Language } from './typing';

const extensionToLanguageMap: Record<string, Language> = {
  '.java': Language.Java,
  '.py': Language.Python,
  '.js': Language.JavaScript,
  '.ts': Language.TypeScript,
  '.cpp': Language.Cpp,
  '.c': Language.C,
  '.cs': Language.CSharp,
  '.html': Language.HTML,
  '.css': Language.CSS,
  '.jsx': Language.JSX,
  '.tsx': Language.TSX,
};

function getLanguageForExtension(extension: string): Language {
  const normalizedExtension = extension.startsWith('.') ? extension : `.${extension}`;
  return (extensionToLanguageMap[normalizedExtension] || Language.Other);
}

function getCurrentFileExtension() {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const document = editor.document;
    const fileUri = document.uri;
    if (fileUri.scheme === 'file') {
      const filePath = fileUri.fsPath;
      const ext = filePath.slice(filePath.lastIndexOf('.'));
      return ext;
    }
  }
  return null;
}

export function getLanguageForCurrentFile(): Language {
  const ext = getCurrentFileExtension();
  if (ext) {
    return getLanguageForExtension(ext);
  }
  return Language.Other;
}