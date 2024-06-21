import { EventEmitter } from 'vscode';

export default {
  onFetchCompletion: new EventEmitter<'START' | 'END'>(),
  onLogin: new EventEmitter<0 | 1>(),
};
