import { Router } from "express";
import { UserRole } from "@prisma/client";
import { CoinPackageRepository } from "../modules/coin-package/repositories/CoinPackageRepository";
import { CoinPackageService } from "../modules/coin-package/services/CoinPackageService";
import { CoinPackageController } from "../modules/coin-package/controllers/CoinPackageController";
import {
  authenticateUser,
  requireUserRole,
} from "../core/middleware/AuthMiddleware";
import {
  validateBody,
  validateParams,
} from "../core/middleware/ValidationMiddleware";
import {
  CreateCoinPackageSchema,
  ParamIdSchema,
  UpdateCoinPackageSchema,
} from "../core/validation/ValidationSchemas";

const coinPackageRepository = new CoinPackageRepository();
const coinPackageService = new CoinPackageService(coinPackageRepository);
const coinPackageController = new CoinPackageController(coinPackageService);

const router = Router();

router.use(authenticateUser, requireUserRole(UserRole.ADMIN));

router.get("/", coinPackageController.listAll);
router.post(
  "/",
  validateBody(CreateCoinPackageSchema),
  coinPackageController.create,
);
router.put(
  "/:id",
  validateParams(ParamIdSchema),
  validateBody(UpdateCoinPackageSchema),
  coinPackageController.update,
);
router.delete(
  "/:id",
  validateParams(ParamIdSchema),
  coinPackageController.deactivate,
);

export default router;
