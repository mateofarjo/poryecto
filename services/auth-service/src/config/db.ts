import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    logger.info('MongoDB connection established');
  } catch (error) {
    logger.error({ error }, 'MongoDB connection failed');
    process.exit(1);
  }
}
