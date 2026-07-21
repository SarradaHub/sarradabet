import { Router } from "express";
import betRoutes from "./bet.routes";
import categoryRoutes from "./category.routes";
import voteRoutes from "./vote.routes";
import devRoutes from "./dev.routes";
import coinRoutes from "./coin.routes";
import paymentRoutes from "./payment.routes";
import adminCoinPackageRoutes from "./admin.coin-package.routes";
import authRoutes from "../modules/auth/routes/auth.routes";
import userRoutes from "../modules/user/routes/user.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/coins", coinRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin/coin-packages", adminCoinPackageRoutes);
router.use("/bets", betRoutes);
router.use("/categories", categoryRoutes);
router.use("/votes", voteRoutes);
router.use("/dev", devRoutes);

router.get("/", (req, res) => {
  res.json({
    name: "SarradaBet API",
    version: "1.0.0",
    description: "Mock betting platform API",
    endpoints: {
      bets: "/api/v1/bets",
      categories: "/api/v1/categories",
      votes: "/api/v1/votes",
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      coins: "/api/v1/coins",
      payments: "/api/v1/payments",
      adminCoinPackages: "/api/v1/admin/coin-packages",
      health: "/health",
    },
  });
});

export default router;
