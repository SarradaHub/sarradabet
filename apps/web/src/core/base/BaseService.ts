import axios, { AxiosInstance, AxiosResponse } from "axios";
import { IApiService, ApiResponse, ApiError } from "../interfaces/IService";
import { requestDeduplicator } from "../utils/requestDeduplicator";

export abstract class BaseService<T, CreateInput, UpdateInput>
  implements IApiService<T, CreateInput, UpdateInput>
{
  protected readonly api: AxiosInstance;

  constructor(baseURL: string, endpoint: string) {
    const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost";
    const directApiUrl = import.meta.env.VITE_API_URL;
    
    const fullBaseURL = baseURL 
      ? `${baseURL}/api/v1/${endpoint}`
      : directApiUrl
        ? `${directApiUrl}/api/v1/${endpoint}`
        : `${apiGatewayUrl}/api/v1/${endpoint}`;
    
    this.api = axios.create({
      baseURL: fullBaseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("authToken") || localStorage.getItem("adminToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('text/html') && typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
          const error = new Error('Received HTML instead of JSON. API server may not be running or URL is incorrect.');
          (error as any).isHtmlResponse = true;
          (error as any).config = response.config;
          return Promise.reject(error);
        }
        return response;
      },
      (error) => {
        const requestUrl = error.config?.url 
          ? `${error.config.baseURL || ''}${error.config.url}`
          : undefined;
        const requestMethod = error.config?.method?.toUpperCase();
        
        const isTimeout = error.code === 'ECONNABORTED' || 
                         error.message?.includes('timeout') ||
                         error.message?.includes('exceeded');
        
        const isHtmlResponse = error.response?.headers?.['content-type']?.includes('text/html') ||
                               (typeof error.response?.data === 'string' && error.response?.data?.includes('<!doctype html>'));
        
        const isNetworkError = !error.response && (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || isTimeout);
        
        let errorMessage = "An error occurred";
        if (isTimeout) {
          errorMessage = "Request timed out. The API server may not be running or is taking too long to respond. Please check that the API server is running on port 8000.";
        } else if (isNetworkError) {
          errorMessage = "Cannot connect to the API server. Please ensure the API server is running on port 8000.";
        } else if (isHtmlResponse) {
          errorMessage = "Received HTML instead of JSON. The API server may not be running or the URL is incorrect. Check that the API is running on port 8000.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        if (import.meta.env.DEV) {
          console.error('API Error:', {
            url: requestUrl,
            method: requestMethod,
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: errorMessage,
            errorCode: error.code,
            isTimeout,
            isNetworkError,
            isHtmlResponse,
            contentType: error.response?.headers?.['content-type'],
            baseURL: error.config?.baseURL,
            actualURL: requestUrl,
            fullError: error,
          });
        }

        const apiError: ApiError = {
          success: false,
          message: errorMessage,
          errors: error.response?.data?.errors,
          url: requestUrl || error.response?.data?.url,
          method: requestMethod || error.response?.data?.method,
          requestId: error.response?.data?.requestId,
        };
        return Promise.reject(apiError);
      },
    );
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

  async create(data: CreateInput): Promise<ApiResponse<T>> {
    const response = await this.api.post<ApiResponse<T>>("/", data);
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
