import crypto from "crypto";
import sharp from "sharp";
import {
  InternalServerError,
  ServiceUnavailableError,
} from "../../../core/errors/AppError";
import { config } from "../../../config/env";
import {
  createSupabaseAdminClient,
  isSupabaseStorageConfigured,
} from "../../../config/supabase";
import { validateImageFile } from "../utils/validateImageFile";

export class StorageService {
  async uploadRewardImage(buffer: Buffer, mime: string): Promise<string> {
    if (!isSupabaseStorageConfigured()) {
      throw new ServiceUnavailableError("Image upload is not configured");
    }

    validateImageFile(mime, buffer.length);

    const optimized = await sharp(buffer)
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    if (optimized.length > config.UPLOAD_MAX_BYTES) {
      throw new InternalServerError("Upload failed");
    }

    const path = `rewards/${crypto.randomUUID()}.webp`;
    const supabase = createSupabaseAdminClient();
    const bucket = config.SUPABASE_STORAGE_BUCKET;

    const { error } = await supabase.storage.from(bucket).upload(path, optimized, {
      contentType: "image/webp",
      upsert: false,
    });

    if (error) {
      throw new InternalServerError("Upload failed", { message: error.message });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}
