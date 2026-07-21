import { Router } from "express";
import { coinService, coinPackageService } from "../modules/payment/payment.container";
import { CoinController } from "../modules/coin/controllers/CoinController";
import { authenticateUser } from "../core/middleware/AuthMiddleware";

const coinController = new CoinController(coinService, coinPackageService);

const router = Router();

router.get("/packages", coinController.getPackages);
router.get("/balance", authenticateUser, coinController.getBalance);
router.get("/transactions", authenticateUser, coinController.getTransactions);

export default router;
