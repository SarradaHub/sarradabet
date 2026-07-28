import { CoinRepository } from "../coin/repositories/CoinRepository";
import { CoinService } from "../coin/services/CoinService";
import { CoinPackageRepository } from "../coin-package/repositories/CoinPackageRepository";
import { CoinPackageService } from "../coin-package/services/CoinPackageService";
import { config } from "../../config/env";
import { logger } from "../../utils/logger";
import { PixPaymentRepository } from "./repositories/PixPaymentRepository";
import { MercadoPagoClient } from "./services/MercadoPagoClient";
import { MockMercadoPagoClient } from "./services/MockMercadoPagoClient";
import type { PixGateway } from "./services/PixGateway";
import { PixPaymentService } from "./services/PixPaymentService";

const coinRepository = new CoinRepository();
const coinService = new CoinService(coinRepository);
const coinPackageRepository = new CoinPackageRepository();
const coinPackageService = new CoinPackageService(coinPackageRepository);
const pixPaymentRepository = new PixPaymentRepository();

function createPixGateway(): PixGateway {
  if (config.MERCADOPAGO_MOCK_PIX) {
    logger.warn(
      "Mercado Pago mock Pix enabled — use POST /payments/pix/:id/simulate-approval for local testing",
    );
    return new MockMercadoPagoClient();
  }

  return new MercadoPagoClient();
}

const pixGateway = createPixGateway();

export const pixPaymentService = new PixPaymentService(
  pixPaymentRepository,
  coinService,
  coinPackageService,
  pixGateway,
);

export { coinService, coinPackageService };
