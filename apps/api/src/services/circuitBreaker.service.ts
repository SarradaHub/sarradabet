import CircuitBreaker from "opossum";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { consulService } from "./consul.service";
import { logger } from "../utils/logger";

interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  volumeThreshold?: number;
}

class CircuitBreakerService {
  private breakers: Map<string, CircuitBreaker> = new Map();

  createClient(serviceName: string, baseUrl?: string): AxiosInstance | null {
    const url = baseUrl || null;

    if (!url && !consulService) {
      logger.warn(`No URL provided and Consul not enabled for ${serviceName}`);
      return null;
    }

    const client = axios.create({
      baseURL: url || undefined,
      timeout: 5000,
    });

    // Get or create circuit breaker
    let breaker = this.breakers.get(serviceName);
    if (!breaker) {
      const options: CircuitBreakerOptions = {
        timeout: 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        volumeThreshold: 10,
      };

      breaker = new CircuitBreaker(async (config: AxiosRequestConfig) => {
        const discoveredUrl =
          url || (await consulService.discoverService(serviceName));
        if (!discoveredUrl) {
          throw new Error(`Service ${serviceName} not available`);
        }
        return axios({ ...config, baseURL: discoveredUrl });
      }, options);

      breaker.on("open", () => {
        logger.warn(`Circuit breaker opened for ${serviceName}`);
      });

      breaker.on("halfOpen", () => {
        logger.info(`Circuit breaker half-open for ${serviceName}`);
      });

      breaker.on("close", () => {
        logger.info(`Circuit breaker closed for ${serviceName}`);
      });

      this.breakers.set(serviceName, breaker);
    }

    // Wrap axios calls with circuit breaker
    const originalRequest = client.request.bind(client);
    client.request = async <T = any, R = any>(config: AxiosRequestConfig) => {
      return breaker!.fire(config) as Promise<R>;
    };

    return client;
  }

  async callService(
    serviceName: string,
    method: "get" | "post" | "put" | "patch" | "delete",
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<{
    success: boolean;
    data?: unknown;
    error?: string;
    circuitOpen?: boolean;
  }> {
    const client = this.createClient(serviceName);

    if (!client) {
      return { success: false, error: "Service unavailable" };
    }

    try {
      const response = await client[method](path, data, config);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes("Circuit breaker is open")
      ) {
        logger.error(`Circuit breaker open for ${serviceName}`);
        return {
          success: false,
          error: "Service temporarily unavailable",
          circuitOpen: true,
        };
      }
      logger.error(`Error calling ${serviceName}: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }
}

export const circuitBreakerService = new CircuitBreakerService();
