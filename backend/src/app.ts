import compression from 'compression';
import cors from 'cors';
import express, { type Application } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import type { IncomingMessage } from 'node:http';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './infrastructure/logger/index.js';
import { ErrorCode } from './shared/errors/index.js';
import { HttpStatus } from './shared/constants/httpStatus.js';
import { apiRouter } from './presentation/http/routes/index.js';
import { errorHandler, notFoundHandler } from './presentation/http/middlewares/index.js';
import { ApiResponse } from './presentation/http/response/index.js';
import { setupSwagger } from './presentation/http/swagger/index.js';

export function createApp(): Application {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req: IncomingMessage) =>
          req.url === `${env.API_PREFIX}/health` ||
          req.url?.startsWith(`${env.API_PREFIX}/docs`) === true,
      },
    }),
  );

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        ApiResponse.error(res, {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests, please try again later',
          code: ErrorCode.RATE_LIMITED,
          path: req.originalUrl,
        });
      },
    }),
  );

  setupSwagger(app);

  app.get('/', (_req, res) => {
    ApiResponse.success(
      res,
      {
        name: 'AI Developer Report Generator API',
        version: '1.0.0',
        prefix: env.API_PREFIX,
        docs: `${env.API_PREFIX}/docs`,
      },
      'API is running',
    );
  });

  app.use(env.API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
