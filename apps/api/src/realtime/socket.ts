import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { config } from "../config/env";
import { logger } from "../utils/logger";
import { verifyAccessToken } from "../utils/auth";

let io: Server | null = null;

function getAllowedOrigins(): string[] {
  return config.CORS_ORIGINS.split(",").map((origin) => origin.trim());
}

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
      methods: ["GET", "POST"],
    },
    path: "/socket.io",
  });

  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      next();
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    const userId = socket.data.userId as number | undefined;
    if (userId) {
      socket.join(`user:${userId}`);
      logger.info(`Socket ${socket.id} joined user:${userId}`);
    }

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info("Socket.io server initialized");
  return io;
}

export function getSocketServer(): Server | null {
  return io;
}

export function closeSocketServer(): void {
  if (io) {
    io.close();
    io = null;
  }
}
