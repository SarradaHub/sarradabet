import type {
  CoinBalance,
  CoinPackage,
  CoinTransaction,
  CreatePixPurchaseResponse,
  PixPaymentStatusResponse,
} from "@sarradabet/types";
import type { ApiResponse } from "../core/interfaces/IService";
import { authApiClient, createApiClient } from "./apiClient";

class CoinService {
  private readonly api = createApiClient("coins");

  async getBalance(): Promise<CoinBalance> {
    const response = await this.api.get<ApiResponse<CoinBalance>>("/balance");
    return response.data.data;
  }

  async getTransactions(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ items: CoinTransaction[]; total: number }>> {
    const response = await this.api.get<
      ApiResponse<{ items: CoinTransaction[]; total: number }>
    >("/transactions", { params });
    return response.data;
  }

  async getPackages(): Promise<CoinPackage[]> {
    const response = await this.api.get<ApiResponse<CoinPackage[]>>("/packages");
    return response.data.data;
  }
}

class PaymentService {
  private readonly api = createApiClient("payments");

  async createPixPurchase(
    coinPackageId: number,
  ): Promise<CreatePixPurchaseResponse> {
    const response = await this.api.post<ApiResponse<CreatePixPurchaseResponse>>(
      "/pix",
      { coinPackageId },
    );
    return response.data.data;
  }

  async getPixPaymentStatus(
    paymentId: number,
  ): Promise<PixPaymentStatusResponse> {
    const response = await this.api.get<ApiResponse<PixPaymentStatusResponse>>(
      `/pix/${paymentId}`,
    );
    return response.data.data;
  }

  async simulateMockApproval(
    paymentId: number,
  ): Promise<PixPaymentStatusResponse> {
    const response = await this.api.post<ApiResponse<PixPaymentStatusResponse>>(
      `/pix/${paymentId}/simulate-approval`,
    );
    return response.data.data;
  }
}

class AuthService {
  private readonly api = authApiClient;

  async register(data: {
    username: string;
    email: string;
    phone: string;
    password: string;
  }) {
    const response = await this.api.post("/register", data);
    return response.data.data;
  }

  async login(data: { username: string; password: string }) {
    const response = await this.api.post("/login", data);
    return response.data.data;
  }

  async getMe() {
    const response = await this.api.get("/me");
    return response.data.data;
  }
}

class AdminCoinPackageService {
  private readonly api = createApiClient("admin/coin-packages");

  async listAll(): Promise<CoinPackage[]> {
    const response = await this.api.get<ApiResponse<CoinPackage[]>>("/");
    return response.data.data;
  }

  async create(data: {
    name: string;
    amountCents: number;
    coinsAmount: number;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<CoinPackage> {
    const response = await this.api.post<ApiResponse<CoinPackage>>("/", data);
    return response.data.data;
  }

  async update(
    id: number,
    data: Partial<{
      name: string;
      amountCents: number;
      coinsAmount: number;
      isActive: boolean;
      sortOrder: number;
    }>,
  ): Promise<CoinPackage> {
    const response = await this.api.put<ApiResponse<CoinPackage>>(`/${id}`, data);
    return response.data.data;
  }

  async deactivate(id: number): Promise<CoinPackage> {
    const response = await this.api.delete<ApiResponse<CoinPackage>>(`/${id}`);
    return response.data.data;
  }
}

export const coinService = new CoinService();
export const paymentService = new PaymentService();
export const authService = new AuthService();
export const adminCoinPackageService = new AdminCoinPackageService();
