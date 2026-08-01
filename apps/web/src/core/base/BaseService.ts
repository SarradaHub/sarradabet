import { AxiosInstance, AxiosResponse } from "axios";
import { IApiService, ApiResponse } from "../interfaces/IService";
import { requestDeduplicator } from "../utils/requestDeduplicator";
import { createApiClient } from "../../services/apiClient";

function headerValue(
  headers: AxiosResponse["headers"],
  key: string,
): string {
  const value = headers[key];
  return typeof value === "string" ? value : "";
}

export abstract class BaseService<T, CreateInput, UpdateInput, CreateResult = T>
  implements IApiService<T, CreateInput, UpdateInput, CreateResult>
{
  protected readonly api: AxiosInstance;

  constructor(_baseURL: string | undefined, endpoint: string) {
    this.api = createApiClient(endpoint);
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.api.interceptors.response.use((response: AxiosResponse) => {
      const contentType = headerValue(response.headers, "content-type");
      if (
        contentType.includes("text/html") &&
        typeof response.data === "string" &&
        response.data.includes("<!doctype html>")
      ) {
        const error = new Error(
          "Received HTML instead of JSON. API server may not be running or URL is incorrect.",
        );
        (error as any).isHtmlResponse = true;
        (error as any).config = response.config;
        return Promise.reject(error);
      }
      return response;
    });
  }

  async getAll(): Promise<ApiResponse<T[]>> {
    const endpoint = this.api.defaults.baseURL + "/";
    return requestDeduplicator.deduplicate(`GET:${endpoint}`, async () => {
      const response = await this.api.get<ApiResponse<T[]>>("/");
      return response.data;
    });
  }

  async getById(id: number): Promise<ApiResponse<T>> {
    const endpoint = this.api.defaults.baseURL + `/${id}`;
    return requestDeduplicator.deduplicate(`GET:${endpoint}`, async () => {
      const response = await this.api.get<ApiResponse<T>>(`/${id}`);
      return response.data;
    });
  }

  async create(data: CreateInput): Promise<ApiResponse<CreateResult>> {
    const response = await this.api.post<ApiResponse<CreateResult>>("/", data);
    return response.data;
  }

  async update(id: number, data: UpdateInput): Promise<ApiResponse<T>> {
    const response = await this.api.put<ApiResponse<T>>(`/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await this.api.delete<ApiResponse<void>>(`/${id}`);
    return response.data;
  }

  protected async getWithParams(
    params: Record<string, string | number | boolean | undefined>,
  ): Promise<ApiResponse<T[]>> {
    const endpoint = this.api.defaults.baseURL + "/";
    const paramString = JSON.stringify(params);
    return requestDeduplicator.deduplicate(
      `GET:${endpoint}?${paramString}`,
      async () => {
        const response = await this.api.get<ApiResponse<T[]>>("/", { params });
        return response.data;
      },
    );
  }
}
