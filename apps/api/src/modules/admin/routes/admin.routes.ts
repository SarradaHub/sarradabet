import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import {
  validateBody,
  validateParams,
} from "../../../core/middleware/ValidationMiddleware";
import {
  CreateAdminSchema,
  LoginSchema,
  UpdateAdminSchema,
  ParamIdSchema,
} from "../../../core/validation/ValidationSchemas";
import { authenticateAdmin } from "../../../core/middleware/AuthMiddleware";

const router = Router();
const adminController = new AdminController();

router.post("/login", validateBody(LoginSchema), adminController.login);

router.use(authenticateAdmin);

router.get("/profile", adminController.getProfile);
router.post("/logout", adminController.logout);

router.get("/", adminController.getAll);
router.post("/", validateBody(CreateAdminSchema), adminController.create);

router.get("/:id", validateParams(ParamIdSchema), adminController.getById);

router.put(
  "/:id",
  validateParams(ParamIdSchema),
  validateBody(UpdateAdminSchema),
  adminController.update,
);

router.delete("/:id", validateParams(ParamIdSchema), adminController.delete);

export default router;
