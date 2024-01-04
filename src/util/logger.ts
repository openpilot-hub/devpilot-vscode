export const logger = {
  isProduction: false,
  setProductionMode(isProduction: boolean) {
    this.isProduction = isProduction;
  },
  info(...messages: any[]) {
    console.log('[DevPilot][EXT][INFO]', ...messages);
  },
  error(...messages: any[]) {
    console.log('[DevPilot][EXT][ERROR]', ...messages);
  },
  warn(...messages: any[]) {
    console.log('[DevPilot][EXT][WARN]', ...messages);
  },
  log(...messages: any[]) {
    if (this.isProduction) {
      return;
    }
    console.log('[DevPilot][EXT][LOG]', ...messages);
  },
  debug(...messages: any[]) {
    if (this.isProduction) {
      return;
    }
    console.log('[DevPilot][EXT][DEBUG]', ...messages);
  },
  verbose(...messages: any[]) {
    if (this.isProduction) {
      return;
    }
    console.log('[DevPilot][EXT][VERBOSE]', ...messages);
  },
};