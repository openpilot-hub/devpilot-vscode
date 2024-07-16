import simpleGit from 'simple-git';
import vscode from 'vscode';
import { exec } from 'child_process';

export async function getRepositoryName() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return '';
  }

  const rootPath = workspaceFolders[0].uri.fsPath;

  try {
    const git = simpleGit(rootPath);
    const remotes = await git.getRemotes(true);

    const origin = remotes.find((remote) => remote.name === 'origin');
    if (origin) {
      const url = origin.refs.fetch;
      const repoName =
        url
          ?.split('/')
          .pop()
          ?.replace(/\.git$/, '') ?? '';
      return repoName;
    } else {
      console.log('未找到 origin 远程仓库！');
      return '';
    }
  } catch (error) {
    console.error('获取 Git 仓库信息时出错：', error);
    return '';
  }
}

export function getStagedDiff() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const repoPath = workspaceFolders![0].uri.fsPath;
  return new Promise<string>((resolve, reject) => {
    exec('git diff --cached', { cwd: repoPath }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout); // stdout is the output
      }
    });
  });
}
