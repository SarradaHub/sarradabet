import { BaseService } from "../core/base/BaseService";
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../types/category";
import { ApiResponse } from "../core/interfaces/IService";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export class CategoryService extends BaseService<
  Category,
  CreateCategoryDto,
  UpdateCategoryDto
> {
  constructor() {
    super(API_BASE_URL, "categories");
  }

  async searchCategories(searchTerm: string): Promise<ApiResponse<Category[]>> {
    const response = await this.api.get<ApiResponse<Category[]>>("/search", {
      params: { searchTerm },
    });
    return response.data;
  }

  async getCategoriesWithPagination(
    params: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      search?: string;
    } = {},
  ): Promise<ApiResponse<Category[]>> {
    const response = await this.getWithParams(params);
    return response;
  }
}

export const categoryService = new CategoryService();
