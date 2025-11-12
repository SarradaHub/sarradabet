import { Router } from "express";
import { BetController } from "../controllers/BetController";
import { BetService } from "../services/BetService";
import { BetRepository } from "../repositories/BetRepository";
import { prisma } from "../../../config/db";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../../core/middleware/ValidationMiddleware";
import {
  CreateBetSchema,
  UpdateBetSchema,
  ParamIdSchema,
  ParamCategoryIdSchema,
  BetQuerySchema,
} from "../../../core/validation/ValidationSchemas";
import { EventGatewayClient } from "../../../services/events/EventGatewayClient";

// Dependency injection setup
const betRepository = new BetRepository(prisma);
const eventGatewayClient = new EventGatewayClient();
const betService = new BetService(betRepository, eventGatewayClient);
const betController = new BetController(betService);

const router = Router();

// GET /api/v1/bets - Get all bets with pagination and filtering
router.get(
  "/",
  validateQuery(BetQuerySchema),
  betController.findAll.bind(betController),
);

// GET /api/v1/bets/status/:status - Get bets by status
router.get("/status/:status", betController.findByStatus.bind(betController));

// GET /api/v1/bets/category/:categoryId - Get bets by category
router.get(
  "/category/:categoryId",
  validateParams(ParamCategoryIdSchema),
  betController.findByCategory.bind(betController),
);

// GET /api/v1/bets/:id - Get bet by ID
router.get(
  "/:id",
  validateParams(ParamIdSchema),
  betController.findById.bind(betController),
);

// POST /api/v1/bets - Create new bet
router.post(
  "/",
  validateBody(CreateBetSchema),
  betController.create.bind(betController),
);

// PUT /api/v1/bets/:id - Update bet
router.put(
  "/:id",
  validateParams(ParamIdSchema),
  validateBody(UpdateBetSchema),
  betController.update.bind(betController),
);

// DELETE /api/v1/bets/:id - Delete bet
router.delete(
  "/:id",
  validateParams(ParamIdSchema),
  betController.delete.bind(betController),
);

// PATCH /api/v1/bets/:id/close - Close bet
router.patch(
  "/:id/close",
  validateParams(ParamIdSchema),
  betController.closeBet.bind(betController),
);

// PATCH /api/v1/bets/:id/resolve - Resolve bet with winning odd
router.patch(
  "/:id/resolve",
  validateParams(ParamIdSchema),
  betController.resolveBet.bind(betController),
);

export default router;
