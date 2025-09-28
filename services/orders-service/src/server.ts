import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { connectToDatabase } from "./config/db";
import { env } from "./config/env";
import articleRoutes from "./routes/articleRoutes";
import orderRoutes from "./routes/orderRoutes";
import { logger } from "./utils/logger";

async function bootstrap() {
  await connectToDatabase();

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
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
    res.json({ status: "ok", service: "orders-service" });
  });

  app.use("/api/articles", articleRoutes);
  app.use("/api/orders", orderRoutes);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, "Unhandled error");
    res.status(500).json({ message: "Internal server error" });
  });

  app.listen(env.port, () => {
    logger.info({ port: env.port }, "orders-service listening");
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, "Bootstrap failed");
  process.exit(1);
});