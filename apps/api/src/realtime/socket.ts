import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { config } from "../config/env";
import { logger } from "../utils/logger";

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

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

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
