import { Router } from "express";
import { CategoryController } from "../modules/category/controllers/CategoryController";
import { CategoryService } from "../modules/category/services/CategoryService";
import { CategoryRepository } from "../modules/category/repositories/CategoryRepository";
import { prisma } from "../config/db";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../core/middleware/ValidationMiddleware";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoryQuerySchema,
} from "../core/validation/ValidationSchemas";
import { ParamIdSchema } from "../core/validation/ValidationSchemas";
const categoryRepository = new CategoryRepository(prisma);
const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(categoryService);

const router = Router();
router.get(
  "/",
  validateQuery(CategoryQuerySchema),
  categoryController.findAll.bind(categoryController),
);

router.get(
  "/search",
  categoryController.searchByTitle.bind(categoryController),
);

router.get(
  "/:id",
  validateParams(ParamIdSchema),
  categoryController.findById.bind(categoryController),
);

router.post(
  "/",
  validateBody(CreateCategorySchema),
  categoryController.create.bind(categoryController),
);

router.put(
  "/:id",
  validateParams(ParamIdSchema),
  validateBody(UpdateCategorySchema),
  categoryController.update.bind(categoryController),
);

router.delete(
  "/:id",
  validateParams(ParamIdSchema),
  categoryController.delete.bind(categoryController),
);

export default router;
