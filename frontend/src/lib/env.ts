import { z } from "zod";

const serverEnvSchema = z.object({
  AUTH_SERVICE_URL: z.string().url(),
  ORDERS_SERVICE_URL: z.string().url(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = serverEnvSchema.safeParse({
    AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
    ORDERS_SERVICE_URL: process.env.ORDERS_SERVICE_URL,
  });

  if (!parsed.success) {
    console.error("Invalid server environment", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid server environment variables");
  }

  cachedEnv = parsed.data;
  return parsed.data;
}