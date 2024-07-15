import { Server } from 'http';
import vscode, { Disposable } from 'vscode';
import { logger } from '@/utils/logger';
import { createServer, startServer } from './helper';
import { ILoginProvider, LoginSuccessCallback } from './types';
import { LOGIN } from '@/env';

export default class LoginProvider implements ILoginProvider {
  private _server: Server | null;
  private _port: number | null;
  private _commands: Disposable[] = [];
  private _onSuccess: LoginSuccessCallback | null = null;

  constructor() {
    this._server = null;
    this._port = null;
    this.initialize();
  }

  initialize() {
    this._commands.push(vscode.commands.registerCommand('devpilot.loginSuccess', this.onLoginSuccess));
  }

  onLoginSuccess = (e: any) => {
    const { query } = e;
    if (!query || !query.scope || !query.token) {
      logger.info('[Login]', 'Login invalid => param is missing.');
      return;
    }
    logger.info('[Login]', 'Login success =>', query);
    const userInfo = JSON.parse(decodeURIComponent(atob(query.token)));
    logger.info('[Login]', 'Login user =>', userInfo);
    this._onSuccess?.({ loginType: query.scope, userInfo });
    this.stopServe();
  };

  onLogin = (onSuccess: LoginSuccessCallback) => {
    this._onSuccess = onSuccess;
    logger.info('[Login]', 'Start login...');
    this.serve().then((port) => {
      this._port = port;
      logger.info('[Login]', 'Using port =>', port);
      this.open(port);
    });
  };

  open(localPort: number) {
    const backUrl = encodeURIComponent(`http://127.0.0.1:${localPort}/success`);
    const source = encodeURIComponent(`Visual Studio Code`);
    let url = LOGIN;
    // let url = `http://localhost:3000`;
    url += `/login?backUrl=${backUrl}&source=${source}`;
    logger.info('[Login]', 'Login url =>', url);
    vscode.env.openExternal(vscode.Uri.parse(url));
  }

  serve() {
    if (!this._server || !this._port) {
      this._server = createServer();
      return startServer(this._server);
    }
    return Promise.resolve(this._port);
  }

  stopServe() {
    this._server?.close();
    this._server = null;
    this._port = null;
    logger.info('[Login]', 'Login service stoped');
  }

  onDestroy(): void {
    this.stopServe();
    this._onSuccess = null; // Blocking success callback
    this._commands.forEach((item) => item.dispose());
    logger.info('[Login]', 'Login provider destroyed');
  }
}
