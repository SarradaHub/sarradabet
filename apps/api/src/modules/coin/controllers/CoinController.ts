import { NextFunction, Request, Response } from "express";
import { CoinService } from "../services/CoinService";
import { CoinPackageService } from "../../coin-package/services/CoinPackageService";
import { RequestUser } from "../../../core/middleware/AuthMiddleware";
import { ApiResponse } from "../../../utils/api/response";

export class CoinController {
  constructor(
    private readonly coinService: CoinService,
    private readonly coinPackageService: CoinPackageService,
  ) {}

  getBalance = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as Extract<RequestUser, { type: "user" }>;
      const balance = await this.coinService.getBalance(user.userId);
      new ApiResponse(res).success(balance);
    } catch (error) {
      next(error);
    }
  };

  getTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as Extract<RequestUser, { type: "user" }>;
      const page = Number.parseInt(String(req.query.page ?? "1"), 10);
      const limit = Number.parseInt(String(req.query.limit ?? "10"), 10);
      const sortBy = String(req.query.sortBy ?? "createdAt");
      const sortOrder = (req.query.sortOrder as "asc" | "desc") ?? "desc";

      const result = await this.coinService.listTransactions(user.userId, {
        page,
        limit,
        sortBy,
        sortOrder,
      });

      new ApiResponse(res).success(result);
    } catch (error) {
      next(error);
    }
  };

  getPackages = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const packages = await this.coinPackageService.listActive();
      new ApiResponse(res).success(packages);
    } catch (error) {
      next(error);
    }
  };
}
