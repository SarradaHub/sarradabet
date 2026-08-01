import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
  authenticateUser,
  requireUserRole,
} from "../../../core/middleware/AuthMiddleware";
import { validateQuery } from "../../../core/middleware/ValidationMiddleware";
import {
  AnalyticsExportQuerySchema,
  AnalyticsQuerySchema,
} from "../../../core/validation/ValidationSchemas";
import { AnalyticsController } from "../controllers/AnalyticsController";

const router = Router();
const analyticsController = new AnalyticsController();

router.use(authenticateUser, requireUserRole(UserRole.ADMIN));

router.get(
  "/overview",
  validateQuery(AnalyticsQuerySchema),
  analyticsController.getOverview,
);

router.get(
  "/bets-by-category",
  validateQuery(AnalyticsQuerySchema),
  analyticsController.getBetsByCategory,
);

router.get(
  "/pix-revenue",
  validateQuery(AnalyticsQuerySchema),
  analyticsController.getPixRevenue,
);

router.get(
  "/peak-hours",
  validateQuery(AnalyticsQuerySchema),
  analyticsController.getPeakHours,
);

router.get(
  "/export",
  validateQuery(AnalyticsExportQuerySchema),
  analyticsController.exportCsv,
);

export default router;
