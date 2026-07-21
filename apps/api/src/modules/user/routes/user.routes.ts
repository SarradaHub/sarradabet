import { Router } from "express";
import { UserController } from "../controllers/UserController";
import {
  authenticateUser,
  requireSelfOrAdmin,
  requireUserRole,
} from "../../../core/middleware/AuthMiddleware";
import {
  validateBody,
  validateParams,
} from "../../../core/middleware/ValidationMiddleware";
import {
  ParamIdSchema,
  UpdateUserSchema,
} from "../../../core/validation/ValidationSchemas";
import { UserRole } from "@prisma/client";

const router = Router();
const userController = new UserController();

router.use(authenticateUser);

router.get("/", requireUserRole(UserRole.ADMIN), userController.getAll);

router.get(
  "/:id",
  validateParams(ParamIdSchema),
  requireSelfOrAdmin("id"),
  userController.getById,
);

router.put(
  "/:id",
  validateParams(ParamIdSchema),
  validateBody(UpdateUserSchema),
  requireSelfOrAdmin("id"),
  userController.update,
);

router.delete(
  "/:id",
  validateParams(ParamIdSchema),
  requireUserRole(UserRole.ADMIN),
  userController.delete,
);

export default router;
