import pino from 'pino';
import { env } from '../../config/env.js';

const isDev = env.NODE_ENV === 'development';

export const logger = pino({
  level: env.LOG_LEVEL,
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
  base: {
    service: 'developer-report-generator-api',
    env: env.NODE_ENV,
  },
});

export type Logger = typeof logger;
