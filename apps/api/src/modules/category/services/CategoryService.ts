import { BaseService } from "../../../core/base/BaseService";
import {
  CategoryRepository,
  CategoryWithStats,
} from "../repositories/CategoryRepository";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../../../core/validation/ValidationSchemas";
import {
  PaginationParams,
  PaginatedResult,
} from "../../../core/interfaces/IRepository";
import { NotFoundError, ConflictError } from "../../../core/errors/AppError";
import { cacheService } from "../../../core/cache/CacheService";

export class CategoryService extends BaseService<
  CategoryWithStats,
  CreateCategoryInput,
  UpdateCategoryInput
> {
  constructor(private readonly categoryRepository: CategoryRepository) {
    super(categoryRepository);
  }

  async findAll(
    params?: PaginationParams,
  ): Promise<PaginatedResult<CategoryWithStats>> {
    const resolvedParams = params || {
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
    };

    if (process.env.NODE_ENV !== "test") {
      const cacheKey = `categories:list:${JSON.stringify(resolvedParams)}`;
      const cached =
        cacheService.get<PaginatedResult<CategoryWithStats>>(cacheKey);
      if (cached) {
        return cached;
      }

      const result =
        await this.categoryRepository.findManyWithPagination(resolvedParams);
      cacheService.set(cacheKey, result, 300);
      return result;
    }

    return this.categoryRepository.findManyWithPagination(resolvedParams);
  }

  async findById(id: number): Promise<CategoryWithStats> {
    this.validateId(id);

    const category = await this.categoryRepository.findUnique({ id });
    if (!category) {
      throw new NotFoundError("Category", id);
    }

    return category;
  }

  async create(data: CreateCategoryInput): Promise<CategoryWithStats> {
    await this.validateBusinessRules(data);

    // Check if category with same title already exists
    const existingCategory = await this.categoryRepository.findByTitle(
      data.title,
    );
    if (existingCategory) {
      throw new ConflictError("Category with this title already exists");
    }

    const category = await this.categoryRepository.create(data);
    cacheService.invalidateCategories();
    return await this.executeBusinessLogic(category);
  }

  async update(
    id: number,
    data: UpdateCategoryInput,
  ): Promise<CategoryWithStats> {
    this.validateId(id);

    await this.validateBusinessRules(data);

    // Check if category exists
    await this.handleNotFound(id, "Category");

    // If updating title, check if it already exists
    if (data.title) {
      const existingCategory = await this.categoryRepository.findByTitle(
        data.title,
      );
      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictError("Category with this title already exists");
      }
    }

    const updatedCategory = await this.categoryRepository.update({ id }, data);
    cacheService.invalidateCategories();
    return await this.executeBusinessLogic(updatedCategory);
  }

  async delete(id: number): Promise<void> {
    this.validateId(id);

    // Check if category exists
    const category = await this.findById(id);

    // Business rule: Cannot delete categories that have bets
    if (category._count.bet > 0) {
      throw new ConflictError("Cannot delete category that has bets");
    }

    await this.categoryRepository.delete({ id });
    cacheService.invalidateCategories();
  }

  async searchByTitle(searchTerm: string): Promise<CategoryWithStats[]> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new Error("Search term must be at least 2 characters long");
    }

    return this.categoryRepository.searchByTitle(searchTerm.trim());
  }

  async findByTitle(title: string): Promise<CategoryWithStats | null> {
    return this.categoryRepository.findByTitle(title);
  }
}
