import { NextFunction, Request, Response } from "express";
import { RequestUser } from "../../../core/middleware/AuthMiddleware";
import { TicketImageCacheService } from "../services/TicketImageCacheService";
import { TicketVerifyService } from "../services/TicketVerifyService";

function sendPng(
  res: Response,
  ticketCode: string,
  png: Buffer,
  variant: "redeemed" | "validated" = "redeemed",
): void {
  const filename =
    variant === "validated"
      ? `ticket_validated_${ticketCode}.png`
      : `ticket_${ticketCode}.png`;

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "private, max-age=3600");
  res.send(png);
}

export class TicketController {
  constructor(
    private readonly imageCacheService: TicketImageCacheService = new TicketImageCacheService(),
    private readonly verifyService: TicketVerifyService = new TicketVerifyService(),
  ) {}

  downloadRedemptionImage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as Extract<RequestUser, { type: "user" }>;
      const png = await this.imageCacheService.getRedemptionImage(
        req.params.code,
        user.userId,
      );
      sendPng(res, req.params.code, png);
    } catch (error) {
      next(error);
    }
  };

  downloadValidationImage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const png = await this.imageCacheService.getValidationImage(
        req.params.code,
      );
      sendPng(res, req.params.code, png, "validated");
    } catch (error) {
      next(error);
    }
  };

  downloadUserValidationImage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as Extract<RequestUser, { type: "user" }>;
      const png = await this.imageCacheService.getValidationImageForOwner(
        req.params.code,
        user.userId,
      );
      sendPng(res, req.params.code, png, "validated");
    } catch (error) {
      next(error);
    }
  };

  verifyTicket = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.verifyService.verify(req.params.code);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
