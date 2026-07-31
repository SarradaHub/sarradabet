import { NextFunction, Request, Response } from "express";
import { PixPaymentService } from "../services/PixPaymentService";
import { RequestUser } from "../../../core/middleware/AuthMiddleware";
import { ApiResponse } from "../../../utils/api/response";
import { BadRequestError } from "../../../core/errors/AppError";

export class PaymentController {
  constructor(private readonly pixPaymentService: PixPaymentService) {}

  createPixPurchase = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as Extract<RequestUser, { type: "user" }>;
      const { coinPackageId } = req.body as { coinPackageId: number };
      const result = await this.pixPaymentService.createPurchase(
        user.userId,
        coinPackageId,
      );
      new ApiResponse(res).success(result, 201);
    } catch (error) {
      next(error);
    }
  };

  getPixPaymentStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as Extract<RequestUser, { type: "user" }>;
      const paymentId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(paymentId) || paymentId <= 0) {
        throw new BadRequestError("Invalid ID provided");
      }

      const result = await this.pixPaymentService.getPaymentStatus(
        user.userId,
        paymentId,
      );
      new ApiResponse(res).success(result);
    } catch (error) {
      next(error);
    }
  };

  simulateMockApproval = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as Extract<RequestUser, { type: "user" }>;
      const paymentId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(paymentId) || paymentId <= 0) {
        throw new BadRequestError("Invalid ID provided");
      }

      const result = await this.pixPaymentService.simulateMockApproval(
        user.userId,
        paymentId,
      );
      new ApiResponse(res).success(result);
    } catch (error) {
      next(error);
    }
  };
}
