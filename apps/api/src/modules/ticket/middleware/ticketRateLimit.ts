import rateLimit from "express-rate-limit";
import { config } from "../../../config/env";
import { RequestUser } from "../../../core/middleware/AuthMiddleware";
import { TooManyRequestsError } from "../../../core/errors/AppError";
import { logger } from "../../../utils/logger";

export const ticketImageRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: config.TICKET_IMAGE_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const user = req.user as RequestUser | undefined;
    if (user && user.type === "user") {
      return `ticket-image:user:${user.userId}`;
    }

    return `ticket-image:ip:${req.ip ?? "unknown"}`;
  },
  handler: (req, res, next) => {
    logger.warn(`Ticket image rate limit exceeded for ${req.ip}`, {
      ip: req.ip,
      path: req.path,
    });
    next(
      new TooManyRequestsError(
        "Muitas requisições. Tente novamente em 60 segundos.",
      ),
    );
  },
});

export const ticketVerifyRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new TooManyRequestsError(
        "Muitas requisições. Tente novamente em 60 segundos.",
      ),
    );
  },
});
