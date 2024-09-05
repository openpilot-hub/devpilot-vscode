import vscode from 'vscode';

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
