import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
  authenticateUser,
  requireUserRole,
} from "../../../core/middleware/AuthMiddleware";
import { validateParams } from "../../../core/middleware/ValidationMiddleware";
import { ParamTicketCodeSchema } from "../../../core/validation/ValidationSchemas";
import { TicketController } from "../controllers/TicketController";
import {
  ticketImageRateLimit,
  ticketVerifyRateLimit,
} from "../middleware/ticketRateLimit";

const ticketController = new TicketController();

const publicRouter = Router();
publicRouter.get(
  "/verify/:code",
  ticketVerifyRateLimit,
  validateParams(ParamTicketCodeSchema),
  ticketController.verifyTicket,
);

const rewardTicketRouter = Router();
rewardTicketRouter.get(
  "/:code/validate-image",
  authenticateUser,
  ticketImageRateLimit,
  validateParams(ParamTicketCodeSchema),
  ticketController.downloadUserValidationImage,
);
rewardTicketRouter.get(
  "/:code/image",
  authenticateUser,
  ticketImageRateLimit,
  validateParams(ParamTicketCodeSchema),
  ticketController.downloadRedemptionImage,
);

const adminTicketRouter = Router();
adminTicketRouter.use(authenticateUser, requireUserRole(UserRole.ADMIN));
adminTicketRouter.get(
  "/:code/validate-image",
  ticketImageRateLimit,
  validateParams(ParamTicketCodeSchema),
  ticketController.downloadValidationImage,
);

export { publicRouter as ticketPublicRoutes };
export { rewardTicketRouter as rewardTicketRoutes };
export { adminTicketRouter as adminTicketRoutes };
