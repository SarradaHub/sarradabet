import { Router } from "express";
import { UserRole } from "@prisma/client";
import { RewardRepository } from "../modules/reward/repositories/RewardRepository";
import { RewardService } from "../modules/reward/services/RewardService";
import { RewardController } from "../modules/reward/controllers/RewardController";
import {
  authenticateUser,
  requireUserRole,
} from "../core/middleware/AuthMiddleware";
import {
  validateBody,
  validateParams,
} from "../core/middleware/ValidationMiddleware";
import {
  CreateRewardSchema,
  ParamIdSchema,
  ParamTicketCodeSchema,
  UpdateRewardSchema,
} from "../core/validation/ValidationSchemas";

const rewardRepository = new RewardRepository();
const rewardService = new RewardService(rewardRepository);
const rewardController = new RewardController(rewardService);

const router = Router();

router.get("/", rewardController.listActive);

router.post(
  "/:id/redeem",
  authenticateUser,
  validateParams(ParamIdSchema),
  rewardController.redeem,
);

const adminRouter = Router();
adminRouter.use(authenticateUser, requireUserRole(UserRole.ADMIN));
adminRouter.get("/", rewardController.listAll);
adminRouter.post(
  "/",
  validateBody(CreateRewardSchema),
  rewardController.create,
);
adminRouter.put(
  "/:id",
  validateParams(ParamIdSchema),
  validateBody(UpdateRewardSchema),
  rewardController.update,
);
adminRouter.delete(
  "/:id",
  validateParams(ParamIdSchema),
  rewardController.deactivate,
);
adminRouter.post(
  "/tickets/:code/validate",
  validateParams(ParamTicketCodeSchema),
  rewardController.validateTicket,
);

export { adminRouter as adminRewardRoutes };
export default router;
