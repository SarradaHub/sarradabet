// Note: Keep this file independent of Prisma-specific types for reusability

export interface IRepository<
  T,
  CreateInput,
  UpdateInput,
  WhereInput = Record<string, unknown>,
> {
  findMany(params?: FindManyParams): Promise<T[]>;
  findUnique(where: WhereInput): Promise<T | null>;
  create(data: CreateInput): Promise<T>;
  update(where: WhereInput, data: UpdateInput): Promise<T>;
  delete(where: WhereInput): Promise<T>;
  count(where?: WhereInput): Promise<number>;
}

export interface FindManyParams {
  where?: Record<string, unknown>;
  orderBy?: Record<string, unknown>;
  skip?: number;
  take?: number;
  include?: Record<string, unknown>;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
