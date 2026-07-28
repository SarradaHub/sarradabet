import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { UserStatsController } from "../../stats/controllers/UserStatsController";
import { RewardRepository } from "../../reward/repositories/RewardRepository";
import { RewardService } from "../../reward/services/RewardService";
import { RewardController } from "../../reward/controllers/RewardController";
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
const userStatsController = new UserStatsController();
const rewardController = new RewardController(
  new RewardService(new RewardRepository()),
);

router.use(authenticateUser);

router.get("/me/stats", userStatsController.getMyStats);
router.get("/me/redemptions", rewardController.listMyPendingRedemptions);
router.get(
  "/me/redemptions/validated",
  rewardController.listMyValidatedRedemptions,
);

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
