import { consulService } from "../services/consul.service";
import { logger } from "../utils/logger";

export const initializeConsul = async (): Promise<void> => {
  if (process.env.CONSUL_ENABLED === "true") {
    try {
      await consulService.registerService();

      // Deregister on shutdown
      process.on("SIGTERM", async () => {
        await consulService.deregisterService();
        process.exit(0);
      });

      process.on("SIGINT", async () => {
        await consulService.deregisterService();
        process.exit(0);
      });
    } catch (error) {
      logger.error(`Failed to initialize Consul: ${(error as Error).message}`);
    }
  }
};
