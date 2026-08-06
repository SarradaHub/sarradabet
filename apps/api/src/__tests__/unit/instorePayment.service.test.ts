import {
  CoinTransactionSource,
  PixPaymentStatus,
} from "@prisma/client";
import { InstorePaymentService } from "../../modules/payment/services/InstorePaymentService";
import { PixPaymentRepository } from "../../modules/payment/repositories/PixPaymentRepository";
import { CoinService } from "../../modules/coin/services/CoinService";
import { CoinPackageService } from "../../modules/coin-package/services/CoinPackageService";
import type { InstoreOrderGateway } from "../../modules/payment/services/InstoreOrderGateway";
import { prisma } from "../../config/db";
import { emitPaymentConfirmed } from "../../realtime/emitter";

jest.mock("../../config/db", () => ({
  prisma: {
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../realtime/emitter", () => ({
  emitPaymentConfirmed: jest.fn(),
}));

describe("InstorePaymentService.confirmOrder", () => {
  const pixPaymentRepository = new PixPaymentRepository();
  const coinService = new CoinService();
  const coinPackageService = new CoinPackageService();
  const instoreGateway: InstoreOrderGateway = {
    createOrder: jest.fn(),
    getOrder: jest.fn(),
    approveMockOrder: jest.fn(),
  };
  const service = new InstorePaymentService(
    pixPaymentRepository,
    coinService,
    coinPackageService,
    instoreGateway,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns early when instore order is already approved", async () => {
    const approvedPayment = {
      id: 1,
      userId: 10,
      status: PixPaymentStatus.APPROVED,
      externalId: "instore_mock_abc",
    };

    jest
      .spyOn(pixPaymentRepository, "findByExternalId")
      .mockResolvedValue(approvedPayment as never);

    const result = await service.confirmOrder("instore_mock_abc");

    expect(result).toEqual(approvedPayment);
    expect(instoreGateway.getOrder).not.toHaveBeenCalled();
  });

  it("credits coins and approves payment when Mercado Pago order is approved", async () => {
    const pendingPayment = {
      id: 2,
      userId: 10,
      coinsAmount: 200,
      status: PixPaymentStatus.PENDING,
      externalId: "instore_mock_xyz",
      expiresAt: new Date(Date.now() + 60_000),
      coinPackage: { name: "Instore Package" },
    };

    jest
      .spyOn(pixPaymentRepository, "findByExternalId")
      .mockResolvedValueOnce(pendingPayment as never)
      .mockResolvedValueOnce({
        ...pendingPayment,
        status: PixPaymentStatus.APPROVED,
        paidAt: new Date(),
      } as never);

    jest.spyOn(instoreGateway, "getOrder").mockResolvedValue({
      id: "instore_mock_xyz",
      status: "processed",
      qrCode: "00020126580014BR.GOV.BCB.PIX",
      qrCodeBase64: null,
    });

    const lockedPayment = {
      ...pendingPayment,
      coinPackage: { name: "Instore Package" },
    };

    const approvedPayment = {
      ...lockedPayment,
      status: PixPaymentStatus.APPROVED,
      paidAt: new Date(),
    };

    const creditCoins = jest
      .spyOn(coinService, "creditCoins")
      .mockResolvedValue({ id: 99 } as never);

    jest
      .spyOn(pixPaymentRepository, "updateStatus")
      .mockResolvedValue(approvedPayment as never);

    (prisma.$transaction as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          pixPayment: {
            findUnique: jest.fn().mockResolvedValue(lockedPayment),
          },
          user: {
            findUnique: jest.fn().mockResolvedValue({ coinBalance: 200 }),
          },
        };
        return callback(tx);
      },
    );

    const result = await service.confirmOrder("instore_mock_xyz");

    expect(creditCoins).toHaveBeenCalledWith(
      10,
      200,
      expect.objectContaining({
        source: CoinTransactionSource.PIX_PURCHASE,
        externalId: "mp_instore_instore_mock_xyz",
      }),
      expect.anything(),
    );
    expect(emitPaymentConfirmed).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        paymentId: 2,
        coinsAmount: 200,
        newBalance: 200,
      }),
    );
    expect(result).toEqual(approvedPayment);
  });

  it("rejects invalid external ids", async () => {
    await expect(service.confirmOrder("mp_123")).rejects.toThrow(
      "Invalid instore order id",
    );
  });
});
