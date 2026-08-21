import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../../../core/errors/AppError";
import { RequestUser } from "../../../core/middleware/AuthMiddleware";
import { AdminPixPaymentsQueryInput } from "../../../core/validation/ValidationSchemas";
import { ApiResponse } from "../../../utils/api/response";
import { AdminPixPaymentService } from "../services/AdminPixPaymentService";
import { pixPaymentService } from "../../payment/payment.container";

const adminPixPaymentService = new AdminPixPaymentService(
  undefined,
  pixPaymentService,
);

export class AdminPixPaymentController {
  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = req.query as unknown as AdminPixPaymentsQueryInput;

      const data = await adminPixPaymentService.listPayments({
        status: query.status,
        page: query.page,
        limit: query.limit,
      });

      new ApiResponse(res).success({ ...data });
    } catch (error) {
      next(error);
    }
  };

  approve = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const paymentId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(paymentId) || paymentId <= 0) {
        throw new BadRequestError("Invalid payment ID provided");
      }

      const admin = req.user as Extract<RequestUser, { type: "user" }> | undefined;
      if (!admin) {
        throw new BadRequestError("Authenticated admin required");
      }

      const data = await adminPixPaymentService.approvePayment(
        admin.userId,
        paymentId,
      );

      new ApiResponse(res).success({ ...data });
    } catch (error) {
      next(error);
    }
  };
}
