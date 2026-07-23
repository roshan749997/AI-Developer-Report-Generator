import mongoose from 'mongoose';
import { env } from '../../config/env.js';
import { logger } from '../logger/index.js';

export async function connectDatabase(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected');
  });

  mongoose.connection.on('error', (error) => {
    logger.error({ err: error }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  await mongoose.connect(env.MONGODB_URI);

  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected cleanly');
}
