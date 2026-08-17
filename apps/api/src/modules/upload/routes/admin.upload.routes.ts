import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
  authenticateUser,
  requireUserRole,
} from "../../../core/middleware/AuthMiddleware";
import { UploadController } from "../controllers/UploadController";
import {
  handleUploadErrors,
  rewardImageUpload,
} from "../middleware/uploadMiddleware";

const uploadController = new UploadController();

const router = Router();

router.use(authenticateUser, requireUserRole(UserRole.ADMIN));

router.post(
  "/reward-image",
  rewardImageUpload,
  handleUploadErrors,
  uploadController.uploadRewardImage,
);

export default router;
