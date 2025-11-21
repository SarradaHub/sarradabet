import { circuitBreakerService } from "./circuitBreaker.service";
import { logger } from "../utils/logger";

class IdentityServiceClient {
  private baseUrl = process.env.IDENTITY_SERVICE_URL || "http://identity-service:3001";
  private serviceApiKey = process.env.SERVICE_API_KEY || "";

  async validateToken(token: string): Promise<{
    valid: boolean;
    user?: {
      id: number;
      email: string;
      username: string;
      role: string;
    };
    error?: string;
  }> {
    if (!token) {
      return { valid: false, error: "Token required" };
    }

    const response = await circuitBreakerService.callService(
      "identity-service",
      "post",
      "/api/v1/auth/validate",
      { token },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.success && response.data && (response.data as { success: boolean }).success) {
      const data = response.data as {
        data: {
          user: {
            id: number;
            email: string;
            username: string;
            role: string;
          };
        };
      };
      return {
        valid: true,
        user: data.data.user,
      };
    }

    return {
      valid: false,
      error: response.error || "Token validation failed",
    };
  }

  async getUser(userId: number): Promise<unknown> {
    const response = await circuitBreakerService.callService(
      "identity-service",
      "get",
      `/api/v1/users/${userId}`,
      undefined,
      {
        headers: {
          Authorization: `Bearer ${this.serviceApiKey}`,
        },
      }
    );

    if (response.success && response.data) {
      const data = response.data as { data: unknown };
      return data.data;
    }

    return null;
  }
}

export const identityServiceClient = new IdentityServiceClient();

