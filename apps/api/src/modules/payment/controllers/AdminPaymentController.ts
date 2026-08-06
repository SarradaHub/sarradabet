import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../../../core/errors/AppError";
import { ApiResponse } from "../../../utils/api/response";
import {
  AdminPaymentListParams,
  AdminPaymentService,
} from "../services/AdminPaymentService";

export class AdminPaymentController {
  constructor(private readonly adminPaymentService: AdminPaymentService) {}

  createInstorePurchase = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { userId, coinPackageId } = req.body as {
        userId: number;
        coinPackageId: number;
      };

      const result = await this.adminPaymentService.createInstorePurchase(
        userId,
        coinPackageId,
      );
      new ApiResponse(res).success(result, 201);
    } catch (error) {
      next(error);
    }
  };

  listPayments = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = req.query as unknown as AdminPaymentListParams;
      const result = await this.adminPaymentService.listPayments(query);
      new ApiResponse(res).success(result);
    } catch (error) {
      next(error);
    }
  };

  getPaymentDetail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const paymentId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(paymentId) || paymentId <= 0) {
        throw new BadRequestError("Invalid ID provided");
      }

      const result = await this.adminPaymentService.getPaymentDetail(paymentId);
      new ApiResponse(res).success(result);
    } catch (error) {
      next(error);
    }
  };

  simulateMockInstoreApproval = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const paymentId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(paymentId) || paymentId <= 0) {
        throw new BadRequestError("Invalid ID provided");
      }

      const result =
        await this.adminPaymentService.simulateMockInstoreApproval(paymentId);
      new ApiResponse(res).success(result);
    } catch (error) {
      next(error);
    }
  };
}
