export const logger = {
  isProduction: false,
  setProductionMode(isProduction: boolean) {
    this.isProduction = isProduction;
  },
  info(...messages: any[]) {
    console.info('[DevPilot][INFO]', ...messages);
  },
  error(...messages: any[]) {
    console.error('[DevPilot][ERROR]', ...messages);
  },
  warn(...messages: any[]) {
    console.warn('[DevPilot][WARN]', ...messages);
  },
  log(...messages: any[]) {
    if (this.isProduction) {
      return;
    }
    console.log('[DevPilot][LOG]', ...messages);
  },
  debug(...messages: any[]) {
    if (this.isProduction) {
      return;
    }
    console.debug('[DevPilot][DEBUG]', ...messages);
  },
  verbose(...messages: any[]) {
    if (this.isProduction) {
      return;
    }
    console.log('[DevPilot][VERBOSE]', ...messages);
  },
};
