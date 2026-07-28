import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
  authenticateUser,
  requireUserRole,
} from "../core/middleware/AuthMiddleware";
import { AdminHouseController } from "../controllers/admin.house.controller";

const router = Router();
const adminHouseController = new AdminHouseController();

router.use(authenticateUser, requireUserRole(UserRole.ADMIN));

router.get("/summary", adminHouseController.getSummary);

export default router;
