import { Request, Response, NextFunction } from "express";
import { BaseController } from "../../../core/base/BaseController";
import {
  CATEGORY_LIST_CACHE,
  setCacheControl,
} from "../../../core/middleware/cacheHeaders";
import { CategoryService } from "../services/CategoryService";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../../../core/validation/ValidationSchemas";
import { CategoryWithStats } from "../repositories/CategoryRepository";

export class CategoryController extends BaseController<
  CategoryWithStats,
  CreateCategoryInput,
  UpdateCategoryInput
> {
  constructor(private readonly categoryService: CategoryService) {
    super(categoryService);
  }

  async findAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const params = this.parsePaginationParams(req);
      const result = await this.categoryService.findAll(params);

      if (result.data.length === 0) {
        setCacheControl(res, { noStore: true });
      } else {
        setCacheControl(res, CATEGORY_LIST_CACHE);
      }

      this.sendSuccess(res, result, 200, "Categories retrieved successfully");
    } catch (error) {
      this.handleError(error as Error, res, next);
    }
  }

  async findById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = this.parseId(req);
      const category = await this.categoryService.findById(id);

      this.sendSuccess(
        res,
        { category },
        200,
        "Category retrieved successfully",
      );
    } catch (error) {
      this.handleError(error as Error, res, next);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryData = req.body as CreateCategoryInput;
      const newCategory = await this.categoryService.create(categoryData);

      this.sendSuccess(
        res,
        { category: newCategory },
        201,
        "Category created successfully",
      );
    } catch (error) {
      this.handleError(error as Error, res, next);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = this.parseId(req);
      const updateData = req.body as UpdateCategoryInput;
      const updatedCategory = await this.categoryService.update(id, updateData);

      this.sendSuccess(
        res,
        { category: updatedCategory },
        200,
        "Category updated successfully",
      );
    } catch (error) {
      this.handleError(error as Error, res, next);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = this.parseId(req);
      await this.categoryService.delete(id);

      this.sendSuccess(res, {}, 200, "Category deleted successfully");
    } catch (error) {
      this.handleError(error as Error, res, next);
    }
  }

  async searchByTitle(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { searchTerm } = req.query;

      if (!searchTerm || typeof searchTerm !== "string") {
        this.sendError(res, "Search term is required", 400);
        return;
      }

      const categories = await this.categoryService.searchByTitle(searchTerm);

      this.sendSuccess(
        res,
        { categories },
        200,
        "Categories found successfully",
      );
    } catch (error) {
      this.handleError(error as Error, res, next);
    }
  }
}
