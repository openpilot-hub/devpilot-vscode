import { CodeReference } from '@/typing';
import vscode from 'vscode';
import { getLanguageForMarkdown } from './mapping';

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getConfiguration<T>(key: string, fallback?: any) {
  const config = vscode.workspace.getConfiguration('devpilot');
  const ret = config.get<T>(key) ?? fallback;
  return ret;
}

export function toBase64(text: string) {
  return Buffer.from(text).toString('base64');
}

export function safeParse(json: any | undefined, fallback: any = null) {
  if (json) {
    try {
      return JSON.parse(json);
    } catch (error) {
      console.error(error);
    }
  }
  return fallback;
}

export function removeComments(jsonString: string) {
  let noSingleLineComments = jsonString.replace(/\/\/.*$/gm, '');
  let noComments = noSingleLineComments.replace(/\/\*[\s\S]*?\*\//g, '');
  return noComments;
}

export function wrapInCodeblock(lang: string, code: string) {
  return `\`\`\`${lang}\n${code}\n\`\`\``;
}

export function wrapCodeRefInCodeblock(codeRef?: CodeReference) {
  if (codeRef) {
    return wrapInCodeblock(getLanguageForMarkdown(codeRef.languageId), codeRef.sourceCode);
  }
  return;
}

export function addIndentation(text: string, indentLen: number) {
  const indentation = new Array(indentLen).fill(' ').join('');
  return text
    .split('\n')
    .map((line: string) => indentation + line)
    .join('\n');
}
