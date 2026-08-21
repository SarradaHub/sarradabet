import { CoinRepository } from "../coin/repositories/CoinRepository";
import { CoinService } from "../coin/services/CoinService";
import { CoinPackageRepository } from "../coin-package/repositories/CoinPackageRepository";
import { CoinPackageService } from "../coin-package/services/CoinPackageService";
import { config } from "../../config/env";
import { PixPaymentRepository } from "./repositories/PixPaymentRepository";
import { MercadoPagoInstoreClient } from "./services/MercadoPagoInstoreClient";
import { MockInstoreOrderClient } from "./services/MockInstoreOrderClient";
import { StaticPixGateway } from "./services/StaticPixGateway";
import type { InstoreOrderGateway } from "./services/InstoreOrderGateway";
import { InstorePaymentService } from "./services/InstorePaymentService";
import { PixPaymentService } from "./services/PixPaymentService";

const coinRepository = new CoinRepository();
const coinService = new CoinService(coinRepository);
const coinPackageRepository = new CoinPackageRepository();
const coinPackageService = new CoinPackageService(coinPackageRepository);
const pixPaymentRepository = new PixPaymentRepository();

const pixGateway = new StaticPixGateway();

function createInstoreGateway(): InstoreOrderGateway {
  if (config.MERCADOPAGO_MOCK_PIX) {
    return new MockInstoreOrderClient();
  }

  return new MercadoPagoInstoreClient();
}

const instoreGateway = createInstoreGateway();

export const pixPaymentService = new PixPaymentService(
  pixPaymentRepository,
  coinService,
  coinPackageService,
  pixGateway,
);

export const instorePaymentService = new InstorePaymentService(
  pixPaymentRepository,
  coinService,
  coinPackageService,
  instoreGateway,
);

export { coinService, coinPackageService };
