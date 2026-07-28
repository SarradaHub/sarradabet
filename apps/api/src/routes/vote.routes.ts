import { Router } from "express";
import { createVoteHandler } from "../controllers/vote.controller";
import { validateRequest } from "../utils/validator";
import { CreateVoteSchema } from "../types/vote.types";
import { authenticateUser } from "../core/middleware/AuthMiddleware";

const router = Router();

router.post(
  "/",
  authenticateUser,
  validateRequest(CreateVoteSchema, "body"),
  createVoteHandler,
);

export default router;
