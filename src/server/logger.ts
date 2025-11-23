import pino from 'pino';
import { config } from './config';

/**
 * Create and configure logger instance
 * Uses pino for structured logging
 */
export const logger = pino({
  level: config.logging.level,
  ...(config.logging.pretty && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  base: {
    env: config.nodeEnv,
  },
});

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
