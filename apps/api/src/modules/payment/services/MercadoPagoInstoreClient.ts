import axios, { type AxiosInstance } from "axios";
import { MercadoPagoConfig, User } from "mercadopago";
import { config } from "../../../config/env";
import { ExternalServiceError } from "../../../core/errors/AppError";
import type {
  CreateMercadoPagoPosInput,
  CreateMercadoPagoStoreInput,
  MercadoPagoPosResponse,
  MercadoPagoPosSearchResponse,
  MercadoPagoStoreResponse,
  MercadoPagoStoreSearchResponse,
} from "../types/instore";

interface MercadoPagoApiError {
  message?: string;
  cause?: Array<{ description?: string; code?: number }>;
}

const MERCADOPAGO_API_BASE_URL = "https://api.mercadopago.com";

export function extractPosUuidFromQrImage(qrImageUrl?: string): string | undefined {
  if (!qrImageUrl) {
    return undefined;
  }

  const match = qrImageUrl.match(/\/qr\/\d+\/([a-f0-9]+)(?:\.png)?$/i);
  return match?.[1];
}

export class MercadoPagoInstoreClient {
  private httpClient: AxiosInstance | null = null;
  private userApi: User | null = null;

  constructor(private readonly accessToken?: string) {}

  private getAccessToken(): string {
    const token = this.accessToken ?? config.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      throw new ExternalServiceError(
        "MercadoPago",
        "MERCADOPAGO_ACCESS_TOKEN is not configured",
      );
    }

    return token;
  }

  private getHttpClient(): AxiosInstance {
    if (!this.httpClient) {
      this.httpClient = axios.create({
        baseURL: MERCADOPAGO_API_BASE_URL,
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
    }

    return this.httpClient;
  }

  private getUserApi(): User {
    if (!this.userApi) {
      this.userApi = new User(
        new MercadoPagoConfig({ accessToken: this.getAccessToken() }),
      );
    }

    return this.userApi;
  }

  async getAuthenticatedUserId(): Promise<number> {
    try {
      const profile = await this.getUserApi().get();
      if (!profile.id) {
        throw new ExternalServiceError(
          "MercadoPago",
          "Authenticated user profile did not include an id",
        );
      }

      return profile.id;
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }

      throw this.toExternalServiceError(error, "get authenticated user id");
    }
  }

  async searchStoreByExternalId(
    userId: number,
    externalId: string,
  ): Promise<MercadoPagoStoreResponse | null> {
    try {
      const response =
        await this.getHttpClient().get<MercadoPagoStoreSearchResponse>(
          `/users/${userId}/stores/search`,
          { params: { external_id: externalId } },
        );

      const match = response.data.results?.find(
        (store) => store.external_id === externalId,
      );

      return match ? this.normalizeStore(match) : null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }

      throw this.toExternalServiceError(error, "search store by external id");
    }
  }

  async createStore(
    userId: number,
    payload: CreateMercadoPagoStoreInput,
  ): Promise<MercadoPagoStoreResponse> {
    try {
      const response = await this.getHttpClient().post<
        Omit<MercadoPagoStoreResponse, "id"> & { id: number | string }
      >(`/users/${userId}/stores`, payload);

      return this.normalizeStore(response.data)!;
    } catch (error) {
      throw this.toExternalServiceError(error, "create store");
    }
  }

  async searchPosByExternalId(
    externalId: string,
  ): Promise<MercadoPagoPosResponse | null> {
    try {
      const response = await this.getHttpClient().get<MercadoPagoPosSearchResponse>(
        "/pos",
        { params: { external_id: externalId } },
      );

      const match = response.data.results?.find(
        (pos) => pos.external_id === externalId,
      );

      if (!match) {
        return null;
      }

      const pos = this.normalizePos(match);
      return this.hydratePosDetails(pos);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }

      throw this.toExternalServiceError(error, "search pos by external id");
    }
  }

  async getPosById(posId: number): Promise<MercadoPagoPosResponse> {
    try {
      const response = await this.getHttpClient().get<
        Omit<MercadoPagoPosResponse, "id" | "store_id"> & {
          id: number | string;
          store_id: number | string;
        }
      >(`/pos/${posId}`);

      return this.normalizePos(response.data);
    } catch (error) {
      throw this.toExternalServiceError(error, "get pos by id");
    }
  }

  async hydratePosDetails(
    pos: MercadoPagoPosResponse,
  ): Promise<MercadoPagoPosResponse> {
    if (pos.uuid && pos.qr?.image) {
      return pos;
    }

    const detailed = await this.getPosById(pos.id);
    return {
      ...pos,
      ...detailed,
      id: pos.id,
      external_id: pos.external_id,
      external_store_id: pos.external_store_id,
      uuid: detailed.uuid ?? pos.uuid ?? extractPosUuidFromQrImage(detailed.qr?.image),
    };
  }

  async createPos(
    payload: CreateMercadoPagoPosInput,
  ): Promise<MercadoPagoPosResponse> {
    try {
      const response = await this.getHttpClient().post<
        Omit<MercadoPagoPosResponse, "id" | "store_id"> & {
          id: number | string;
          store_id: number | string;
        }
      >("/pos", payload);

      return this.normalizePos(response.data)!;
    } catch (error) {
      throw this.toExternalServiceError(error, "create pos");
    }
  }

  private normalizeStore(
    store: Omit<MercadoPagoStoreResponse, "id"> & { id: number | string },
  ): MercadoPagoStoreResponse {
    return {
      ...store,
      id: Number(store.id),
    };
  }

  private normalizePos(
    pos: Omit<MercadoPagoPosResponse, "id" | "store_id"> & {
      id: number | string;
      store_id: number | string;
    },
  ): MercadoPagoPosResponse {
    return {
      ...pos,
      id: Number(pos.id),
      store_id: Number(pos.store_id),
    };
  }

  private toExternalServiceError(error: unknown, action: string): ExternalServiceError {
    if (axios.isAxiosError(error)) {
      const mpError = error.response?.data as MercadoPagoApiError | undefined;
      const description =
        mpError?.cause?.[0]?.description ??
        mpError?.message ??
        error.message;

      return new ExternalServiceError("MercadoPago", `${action} failed: ${description}`, {
        mpCause: mpError?.cause,
        status: error.response?.status,
      });
    }

    const mpError = error as MercadoPagoApiError;
    const description =
      mpError.cause?.[0]?.description ??
      mpError.message ??
      (error instanceof Error ? error.message : "Unknown error");

    return new ExternalServiceError("MercadoPago", `${action} failed: ${description}`, {
      mpCause: mpError.cause,
    });
  }
}
