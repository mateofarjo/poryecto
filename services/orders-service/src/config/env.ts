import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4002'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  AUTH_JWT_SECRET: z.string().min(32, 'AUTH_JWT_SECRET must be at least 32 characters'),
  ORDER_NUMBER_PREFIX: z.string().default('ORD'),
  AUTH_SERVICE_URL: z.string().url('AUTH_SERVICE_URL must be a valid URL')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  port: Number(parsed.data.PORT),
  mongoUri: parsed.data.MONGODB_URI,
  authJwtSecret: parsed.data.AUTH_JWT_SECRET,
  orderNumberPrefix: parsed.data.ORDER_NUMBER_PREFIX,
  authServiceUrl: parsed.data.AUTH_SERVICE_URL
};
