import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { connectToDatabase } from "./config/db";
import { env } from "./config/env";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import { ensureAdminUser } from "./services/userService";
import { logger } from "./utils/logger";

async function bootstrap() {
  await connectToDatabase();
  await ensureAdminUser();

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const app = express();

  app.use(helmet());
  app.use(globalLimiter);
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "auth-service" });
  });

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/admin", adminRoutes);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, "Unhandled error");
    res.status(500).json({ message: "Internal server error" });
  });

  app.listen(env.port, () => {
    logger.info({ port: env.port }, "auth-service listening");
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, "Bootstrap failed");
  process.exit(1);
});