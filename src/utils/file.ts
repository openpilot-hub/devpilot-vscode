import path from 'path';
import fs from 'fs';

export function findFileUpwards(filename: string, startFile: string, rootDir: string) {
  let currentDir = path.dirname(startFile);
  while (true) {
    const filePath = path.join(currentDir, filename);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    currentDir = path.dirname(currentDir);
    // if root reached, stop searching;
    if (currentDir === rootDir) {
      return;
    }
  }
}
