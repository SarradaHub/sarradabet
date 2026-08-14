import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../../../core/errors/AppError";
import { RequestUser } from "../../../core/middleware/AuthMiddleware";
import { ApiResponse } from "../../../utils/api/response";
import { AdminCoinService } from "../services/AdminCoinService";

export class AdminCoinController {
  constructor(private readonly adminCoinService: AdminCoinService = new AdminCoinService()) {}

  adjust = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const targetUserId = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(targetUserId) || targetUserId <= 0) {
        throw new BadRequestError("Invalid user ID provided");
      }

      const admin = req.user as Extract<RequestUser, { type: "user" }> | undefined;
      if (!admin) {
        throw new BadRequestError("Authenticated admin required");
      }

      const result = await this.adminCoinService.adjustBalance(
        admin.userId,
        targetUserId,
        req.body,
      );
      new ApiResponse(res).success({ ...result });
    } catch (error) {
      next(error);
    }
  };
}
