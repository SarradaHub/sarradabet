import { app } from "./app";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import { prisma } from "./config/db";
import { MatchEventConsumer } from "./services/events/MatchEventConsumer";

const checkDatabaseConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Database connection successful");
  } catch (error) {
    logger.error("Database connection failed:", error);
    process.exit(1);
  }
};

const startServer = async () => {
  const PORT = config.PORT || 3001;

  try {
    await checkDatabaseConnection();

    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
    });

    const matchConsumer = new MatchEventConsumer();
    matchConsumer.start().catch((error) => {
      logger.error({ err: error }, "Failed to start match event consumer");
    });

    const shutdown = async () => {
      logger.info("Shutting down server...");
      server.close(async () => {
        await prisma.$disconnect();
        logger.info("Server and database connections closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    logger.error("Server startup failed:", error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}
