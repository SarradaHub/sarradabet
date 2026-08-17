import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../../../core/errors/AppError";
import { ApiResponse } from "../../../utils/api/response";
import { StorageService } from "../services/StorageService";

export class UploadController {
  constructor(
    private readonly storageService: StorageService = new StorageService(),
  ) {}

  uploadRewardImage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError("No file uploaded");
      }

      const url = await this.storageService.uploadRewardImage(
        req.file.buffer,
        req.file.mimetype,
      );

      new ApiResponse(res).success({ url });
    } catch (error) {
      next(error);
    }
  };
}
