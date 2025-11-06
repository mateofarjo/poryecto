import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4001'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters').optional(),
  JWT_REFRESH_TTL: z.string().optional(),
  ADMIN_EMAIL: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters'),
  ADMIN_NAME: z.string().default('Admin'),
  AUTH_RATE_LIMIT_MAX: z.string().optional(),
  AUTH_RATE_LIMIT_WINDOW_MS: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  port: Number(parsed.data.PORT),
  mongoUri: parsed.data.MONGODB_URI,
  jwtSecret: parsed.data.JWT_SECRET,
  jwtRefreshSecret: parsed.data.JWT_REFRESH_SECRET ?? parsed.data.JWT_SECRET,
  jwtRefreshTtl: parsed.data.JWT_REFRESH_TTL ?? '7d',
  adminEmail: parsed.data.ADMIN_EMAIL.toLowerCase(),
  adminPassword: parsed.data.ADMIN_PASSWORD,
  adminName: parsed.data.ADMIN_NAME,
  authRateLimitMax: parsed.data.AUTH_RATE_LIMIT_MAX ? Number(parsed.data.AUTH_RATE_LIMIT_MAX) : 60,
  authRateLimitWindowMs: parsed.data.AUTH_RATE_LIMIT_WINDOW_MS ? Number(parsed.data.AUTH_RATE_LIMIT_WINDOW_MS) : 5 * 60 * 1000
};
