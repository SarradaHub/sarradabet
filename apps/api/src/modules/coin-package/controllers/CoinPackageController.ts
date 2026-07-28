import { NextFunction, Request, Response } from "express";
import { CoinPackageService } from "../services/CoinPackageService";
import { ApiResponse } from "../../../utils/api/response";
import { BadRequestError } from "../../../core/errors/AppError";

export class CoinPackageController {
  constructor(private readonly coinPackageService: CoinPackageService) {}

  listAll = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const packages = await this.coinPackageService.listAll();
      new ApiResponse(res).success(packages);
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
      const coinPackage = await this.coinPackageService.create(req.body);
      new ApiResponse(res).success(coinPackage, 201);
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

      const coinPackage = await this.coinPackageService.update(id, req.body);
      new ApiResponse(res).success(coinPackage);
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

      const coinPackage = await this.coinPackageService.deactivate(id);
      new ApiResponse(res).success(coinPackage);
    } catch (error) {
      next(error);
    }
  };
}
