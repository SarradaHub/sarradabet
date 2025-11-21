export interface IApiService<T, CreateInput, UpdateInput> {
  getAll(): Promise<ApiResponse<T[]>>;
  getById(id: number): Promise<ApiResponse<T>>;
  create(data: CreateInput): Promise<ApiResponse<T>>;
  update(id: number, data: UpdateInput): Promise<ApiResponse<T>>;
  delete(id: number): Promise<ApiResponse<void>>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
  url?: string;
  method?: string;
  requestId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
