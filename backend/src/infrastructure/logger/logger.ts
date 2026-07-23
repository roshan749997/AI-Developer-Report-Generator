import pino from 'pino';
import { env } from '../../config/env.js';

/**
 * Pretty transport is a local-dev convenience only.
 * On Render/production it must stay off — pino-pretty is a devDependency
 * and loading it crashes the process (often exit 134) before the port binds.
 */
const usePrettyTransport =
  env.NODE_ENV === 'development' &&
  process.env.PINO_PRETTY !== 'false' &&
  !process.env.RENDER;

export const logger = pino({
  level: env.LOG_LEVEL,
  ...(usePrettyTransport
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
