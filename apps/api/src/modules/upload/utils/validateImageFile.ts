import { BadRequestError } from "../../../core/errors/AppError";
import { config } from "../../../config/env";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function validateImageFile(mime: string, size: number): void {
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    throw new BadRequestError("Unsupported image type");
  }

  if (size > config.UPLOAD_MAX_BYTES) {
    throw new BadRequestError("File too large");
  }
}

export { ALLOWED_MIME_TYPES };
