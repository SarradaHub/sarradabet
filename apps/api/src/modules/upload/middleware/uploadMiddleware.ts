import multer, { MulterError } from "multer";
import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../../../core/errors/AppError";
import { config } from "../../../config/env";
import { ALLOWED_MIME_TYPES } from "../utils/validateImageFile";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.UPLOAD_MAX_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new BadRequestError("Unsupported image type"));
      return;
    }

    callback(null, true);
  },
});

export const rewardImageUpload = upload.single("file");

export function handleUploadErrors(
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      next(new BadRequestError("File too large"));
      return;
    }

    next(new BadRequestError(err.message));
    return;
  }

  next(err);
}
