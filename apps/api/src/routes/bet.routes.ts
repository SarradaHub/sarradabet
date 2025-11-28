import { Router } from "express";
import { BetController } from "../modules/bet/controllers/BetController";
import { BetService } from "../modules/bet/services/BetService";
import { BetRepository } from "../modules/bet/repositories/BetRepository";
import { prisma } from "../config/db";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../core/middleware/ValidationMiddleware";
import {
  CreateBetSchema,
  UpdateBetSchema,
  BetQuerySchema,
} from "../core/validation/ValidationSchemas";
import {
  ParamIdSchema,
  ParamCategoryIdSchema,
} from "../core/validation/ValidationSchemas";
const betRepository = new BetRepository(prisma);
const betService = new BetService(betRepository);
const betController = new BetController(betService);

const router = Router();
router.get(
  "/",
  validateQuery(BetQuerySchema),
  betController.findAll.bind(betController),
);

router.get("/status/:status", betController.findByStatus.bind(betController));

router.get(
  "/category/:categoryId",
  validateParams(ParamCategoryIdSchema),
  betController.findByCategory.bind(betController),
);

router.get(
  "/:id",
  validateParams(ParamIdSchema),
  betController.findById.bind(betController),
);

router.post(
  "/",
  validateBody(CreateBetSchema),
  betController.create.bind(betController),
);

router.put(
  "/:id",
  validateParams(ParamIdSchema),
  validateBody(UpdateBetSchema),
  betController.update.bind(betController),
);

router.delete(
  "/:id",
  validateParams(ParamIdSchema),
  betController.delete.bind(betController),
);

router.patch(
  "/:id/close",
  validateParams(ParamIdSchema),
  betController.closeBet.bind(betController),
);

router.patch(
  "/:id/resolve",
  validateParams(ParamIdSchema),
  betController.resolveBet.bind(betController),
);

export default router;
