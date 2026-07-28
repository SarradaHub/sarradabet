import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
  authenticateUser,
  requireUserRole,
} from "../core/middleware/AuthMiddleware";
import { triggerBetStatusJobNow, triggerAnalyticsRefreshJobNow } from "../jobs";
import { ApiResponse } from "../utils/api/response";

const router = Router();

const canAccessJobs =
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV === "test" ||
  process.env.ENABLE_JOB_ROUTES === "true";

if (canAccessJobs) {
  router.post(
    "/bet-status/run",
    authenticateUser,
    requireUserRole(UserRole.ADMIN),
    async (req, res, next) => {
      try {
        const result = await triggerBetStatusJobNow();
        new ApiResponse(res).success(result);
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/analytics-refresh/run",
    authenticateUser,
    requireUserRole(UserRole.ADMIN),
    async (req, res, next) => {
      try {
        await triggerAnalyticsRefreshJobNow();
        new ApiResponse(res).success({ refreshed: true });
      } catch (error) {
        next(error);
      }
    },
  );
}

export default router;
