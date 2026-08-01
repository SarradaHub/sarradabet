import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient({
  log: [
    { level: "warn", emit: "event" },
    { level: "error", emit: "event" },
  ],
});

prisma.$on("warn" as never, (e: { message: string }) => {
  logger.warn(`Prisma Warning: ${e.message}`);
});

prisma.$on("error" as never, (e: { message: string }) => {
  logger.error(`Prisma Error: ${e.message}`);
});

let isPrismaDisconnected = false;

const shutdownPrisma = async () => {
  if (isPrismaDisconnected) {
    return;
  }

  isPrismaDisconnected = true;
  logger.info("Disconnecting from database...");
  await prisma.$disconnect();
  logger.info("Database disconnected");
};

process.on("SIGINT", () => {
  void shutdownPrisma();
});
process.on("SIGTERM", () => {
  void shutdownPrisma();
});

export { prisma };
