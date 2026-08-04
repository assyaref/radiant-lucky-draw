/**
 * Logger utility
 *
 * Simple structured logger with levels.
 * In production, this could be replaced with Winston or Pino.
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

const LOG_LEVELS: Record<string, LogLevel> = {
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG,
};

function getLevel(): LogLevel {
  const level = process.env.LOG_LEVEL || 'dev';
  return LOG_LEVELS[level] ?? LogLevel.INFO;
}

function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  error(message: string, meta?: Record<string, unknown>): void {
    if (getLevel() >= LogLevel.ERROR) {
      console.error(JSON.stringify({ level: 'error', timestamp: timestamp(), message, ...meta }));
    }
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    if (getLevel() >= LogLevel.WARN) {
      console.warn(JSON.stringify({ level: 'warn', timestamp: timestamp(), message, ...meta }));
    }
  },

  info(message: string, meta?: Record<string, unknown>): void {
    if (getLevel() >= LogLevel.INFO) {
      console.info(JSON.stringify({ level: 'info', timestamp: timestamp(), message, ...meta }));
    }
  },

  debug(message: string, meta?: Record<string, unknown>): void {
    if (getLevel() >= LogLevel.DEBUG) {
      console.debug(JSON.stringify({ level: 'debug', timestamp: timestamp(), message, ...meta }));
    }
  },
};
