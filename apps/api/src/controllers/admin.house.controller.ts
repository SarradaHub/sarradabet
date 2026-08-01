import { Request, Response, NextFunction } from "express";
import { houseTreasuryService } from "../modules/coin/services/HouseTreasuryService";
import { ApiResponse } from "../utils/api/response";

export class AdminHouseController {
  getSummary = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const summary = await houseTreasuryService.getSummary();
      new ApiResponse(res).success(summary);
    } catch (error) {
      next(error);
    }
  };
}
