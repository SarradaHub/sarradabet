import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config/env";
import { errorHandler, notFoundHandler } from "./core/middleware/ErrorHandler";
import {
  securityHeaders,
  createRateLimit,
  requestSizeLimit,
  sanitizeRequest,
  corsOptions,
} from "./core/middleware/SecurityMiddleware";
import router from "./routes";
import { logger } from "./utils/logger";

export const app = express();

app.use(securityHeaders);
app.use(requestSizeLimit("10mb"));
app.use(sanitizeRequest);

app.use(cors(corsOptions));

app.use(
  createRateLimit({
    windowMs: 15 * 60 * 1000,
    max: config.NODE_ENV === "development" ? 1000 : 100,
    message: "Too many requests from this IP, please try again later",
    skipSuccessfulRequests: config.NODE_ENV === "development",
  }),
);

if (config.NODE_ENV !== "test") {
  app.use(morgan(config.NODE_ENV === "development" ? "dev" : "combined"));
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/health", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.status(200).json({
    status: "ok",
    service: "sarradabet-api",
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

app.get("/ready", async (req, res) => {
  try {
    const { prisma } = await import("./config/db");
    await prisma.$queryRaw`SELECT 1`;
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.status(200).json({
      status: "ready",
      service: "sarradabet-api",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "not ready",
      service: "sarradabet-api",
      error: "Database connection failed",
    });
  }
});

// Root route handler
app.get("/", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.status(200).json({
    name: "SarradaBet API",
    version: "1.0.0",
    description: "Mock betting platform API",
    endpoints: {
      api: "/api/v1",
      health: "/health",
      bets: "/api/v1/bets",
      categories: "/api/v1/categories",
      votes: "/api/v1/votes",
      admin: "/api/v1/admin",
    },
    documentation: "API routes are available under /api/v1",
  });
});

app.use("/api/v1", router);

app.use(notFoundHandler);

app.use(errorHandler);

process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, error);
  process.exit(1);
});
