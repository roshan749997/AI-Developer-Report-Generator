import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './infrastructure/database/index.js';
import { scanSchedulerService } from './infrastructure/scheduler/index.js';
import { jobScheduler } from './jobs/index.js';
import { logger } from './infrastructure/logger/index.js';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await scanSchedulerService.start();
  jobScheduler.start();

  const app = createApp();
  // Bind 0.0.0.0 so Render (and other hosts) can detect the open port.
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(
      {
        port: env.PORT,
        env: env.NODE_ENV,
        prefix: env.API_PREFIX,
      },
      'HTTP server started',
    );
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');
    scanSchedulerService.stop();
    jobScheduler.stop();

    server.close(async (closeError) => {
      if (closeError) {
        logger.error({ err: closeError }, 'Error while closing HTTP server');
        process.exit(1);
      }

      try {
        await disconnectDatabase();
        logger.info('Graceful shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error({ err: error }, 'Error during database disconnect');
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled promise rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception');
    process.exit(1);
  });
}

bootstrap().catch((error) => {
  logger.fatal({ err: error }, 'Failed to bootstrap application');
  process.exit(1);
});
