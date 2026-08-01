import { NextFunction, Request, Response } from "express";
import { RequestUser } from "../../../core/middleware/AuthMiddleware";
import { ApiResponse } from "../../../utils/api/response";
import { DashboardService } from "../services/DashboardService";

export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService = new DashboardService(),
  ) {}

  getMyDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as Extract<RequestUser, { type: "user" }>;
      const { page, limit } = req.query as unknown as {
        page: number;
        limit: number;
      };
      const dashboard = await this.dashboardService.getUserDashboard(
        user.userId,
        { page, limit },
      );
      new ApiResponse(res).success({ ...dashboard });
    } catch (error) {
      next(error);
    }
  };
}
