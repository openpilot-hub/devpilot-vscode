import http, { Server } from 'http';
import vscode from 'vscode';
import url from 'url';
import { logger } from '@/utils/logger';

export function createServer() {
  const server = http.createServer(function (req, res) {
    const reqUrl = url.parse(req.url!, true);
    logger.info('[Login]', 'Req url =>', req.url);
    if (reqUrl.pathname === '/success') {
      res.writeHead(200);
      res.end('ok');
      // Need to block OPTIONS, otherwise it will be notified twice
      if (/GET/i.test(req.method!)) {
        vscode.commands.executeCommand('devpilot.loginSuccess', {
          query: reqUrl.query,
        });
      }
    } else {
      res.writeHead(404);
      res.end('NOT FOUND!');
    }
  });

  return server;
}

// TODO: 增加登录超时，比如5分钟，超时后关闭服务，继续登录的话，提示超时、重来

export function startServer(server: Server) {
  const host = '127.0.0.1';
  let port = 9120;
  return new Promise<number>((resolve) => {
    server.on('error', (e) => {
      logger.error(e);
      // @ts-ignore
      if (e.code === 'EADDRINUSE') {
        logger.error('Address in use, retrying...');
        setTimeout(() => {
          server.close();
          port += 1;
          server.listen(port, host);
        }, 1000);
      }
    });
    server.on('listening', () => {
      resolve(port);
    });
    server.listen(port, '127.0.0.1');
  });
}
