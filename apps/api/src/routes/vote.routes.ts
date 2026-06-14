import { Router } from "express";
import { createVoteHandler } from "../controllers/vote.controller";
import { validateRequest } from "../utils/validator";
import { CreateVoteSchema } from "../types/vote.types";

const router = Router();

router.post("/", validateRequest(CreateVoteSchema, "body"), createVoteHandler);

export default router;
