import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../../../core/errors/AppError";
import { RequestUser } from "../../../core/middleware/AuthMiddleware";
import { ApiResponse } from "../../../utils/api/response";
import { RewardService } from "../services/RewardService";

export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  listActive = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const rewards = await this.rewardService.listActive();
      new ApiResponse(res).success(rewards);
    } catch (error) {
      next(error);
    }
  };

  redeem = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as Extract<RequestUser, { type: "user" }>;
      const id = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(id) || id <= 0) {
        throw new BadRequestError("Invalid ID provided");
      }

      const result = await this.rewardService.redeem(id, user.userId);
      new ApiResponse(res).success(result, 201);
    } catch (error) {
      next(error);
    }
  };

  listAll = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const rewards = await this.rewardService.listAll();
      new ApiResponse(res).success(rewards);
    } catch (error) {
      next(error);
    }
  };

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const reward = await this.rewardService.create(req.body);
      new ApiResponse(res).success(reward, 201);
    } catch (error) {
      next(error);
    }
  };

  update = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(id) || id <= 0) {
        throw new BadRequestError("Invalid ID provided");
      }

      const reward = await this.rewardService.update(id, req.body);
      new ApiResponse(res).success(reward);
    } catch (error) {
      next(error);
    }
  };

  deactivate = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(id) || id <= 0) {
        throw new BadRequestError("Invalid ID provided");
      }

      const reward = await this.rewardService.deactivate(id);
      new ApiResponse(res).success(reward);
    } catch (error) {
      next(error);
    }
  };

  listMyPendingRedemptions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as Extract<RequestUser, { type: "user" }>;
      const redemptions = await this.rewardService.listMyPendingRedemptions(
        user.userId,
      );
      new ApiResponse(res).success(redemptions);
    } catch (error) {
      next(error);
    }
  };

  listMyValidatedRedemptions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as Extract<RequestUser, { type: "user" }>;
      const redemptions = await this.rewardService.listMyValidatedRedemptions(
        user.userId,
      );
      new ApiResponse(res).success(redemptions);
    } catch (error) {
      next(error);
    }
  };

  validateTicket = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = req.user as Extract<RequestUser, { type: "user" }>;
      const result = await this.rewardService.validateTicket(
        req.params.code,
        user.userId,
      );
      new ApiResponse(res).success(result);
    } catch (error) {
      next(error);
    }
  };
}
