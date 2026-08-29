import pino, { type Logger } from 'pino';

export function createLogger(): Logger {
  return pino({ level: process.env.CYNOS_LOG_LEVEL ?? 'info' });
}
