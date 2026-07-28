import { Router } from "express";
import { StatsController } from "../modules/stats/controllers/StatsController";
import { validateQuery } from "../core/middleware/ValidationMiddleware";
import { LeaderboardQuerySchema } from "../core/validation/ValidationSchemas";

const statsController = new StatsController();

const router = Router();

router.get(
  "/",
  validateQuery(LeaderboardQuerySchema),
  statsController.getLeaderboard,
);

export default router;
