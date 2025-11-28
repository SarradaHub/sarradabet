import Consul from "consul";
import { logger } from "../utils/logger";

class ConsulService {
  private client: InstanceType<typeof Consul> | null = null;
  private serviceName = "sarradabet-api";
  private servicePort = parseInt(process.env.PORT || "8000", 10);
  private consulUrl = process.env.CONSUL_URL || "http://localhost:8500";

  constructor() {
    if (this.isEnabled()) {
      this.client = new Consul({
        host: this.consulUrl.replace("http://", "").split(":")[0],
        port: this.consulUrl.includes(":")
          ? parseInt(this.consulUrl.split(":")[2] || "8500", 10)
          : 8500,
        promisify: true,
      });
    }
  }

  async registerService(): Promise<void> {
    if (!this.isEnabled() || !this.client) {
      return;
    }

    try {
      const serviceAddress = process.env.SERVICE_ADDRESS || "localhost";

      await this.client.agent.service.register({
        name: this.serviceName,
        id: this.serviceName,
        address: serviceAddress,
        port: this.servicePort,
        tags: ["nodejs", "api", "v1"],
        check: {
          http: `http://${serviceAddress}:${this.servicePort}/health`,
          interval: "10s",
          timeout: "5s",
          deregistercriticalserviceafter: "30s",
        },
      });

      logger.info(
        `Registered ${this.serviceName} with Consul at ${this.consulUrl}`,
      );
    } catch (error) {
      logger.error(
        `Failed to register with Consul: ${(error as Error).message}`,
      );
    }
  }

  async deregisterService(): Promise<void> {
    if (!this.isEnabled() || !this.client) {
      return;
    }

    try {
      await this.client.agent.service.deregister(this.serviceName);
      logger.info(`Deregistered ${this.serviceName} from Consul`);
    } catch (error) {
      logger.error(
        `Failed to deregister from Consul: ${(error as Error).message}`,
      );
    }
  }

  async discoverService(serviceName: string): Promise<string | null> {
    if (!this.isEnabled() || !this.client) {
      return null;
    }

    try {
      const services = await this.client.health.service({
        service: serviceName,
        passing: true,
      });

      if (services.length === 0) {
        return null;
      }

      const service = services[0].Service;
      return `http://${service.Address}:${service.Port}`;
    } catch (error) {
      logger.error(
        `Failed to discover service ${serviceName}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private isEnabled(): boolean {
    return process.env.CONSUL_ENABLED === "true";
  }
}

export const consulService = new ConsulService();
