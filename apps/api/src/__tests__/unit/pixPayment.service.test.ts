import { createHmac } from "crypto";
import {
  CoinTransactionSource,
  PixPaymentStatus,
} from "@prisma/client";
import { PixPaymentService } from "../../modules/payment/services/PixPaymentService";
import { PixPaymentRepository } from "../../modules/payment/repositories/PixPaymentRepository";
import { CoinService } from "../../modules/coin/services/CoinService";
import { CoinPackageService } from "../../modules/coin-package/services/CoinPackageService";
import { MercadoPagoClient } from "../../modules/payment/services/MercadoPagoClient";
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

describe("PixPaymentService.confirmPayment", () => {
  const pixPaymentRepository = new PixPaymentRepository();
  const coinService = new CoinService();
  const coinPackageService = new CoinPackageService();
  const mercadoPagoClient = new MercadoPagoClient();
  const service = new PixPaymentService(
    pixPaymentRepository,
    coinService,
    coinPackageService,
    mercadoPagoClient,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(mercadoPagoClient, "getPayment");
  });

  it("returns early when payment is already approved", async () => {
    const approvedPayment = {
      id: 1,
      userId: 10,
      status: PixPaymentStatus.APPROVED,
      externalId: "mp_123",
    };

    jest
      .spyOn(pixPaymentRepository, "findByExternalId")
      .mockResolvedValue(approvedPayment as never);

    const result = await service.confirmPayment("mp_123");

    expect(result).toEqual(approvedPayment);
    expect(mercadoPagoClient.getPayment).not.toHaveBeenCalled();
  });

  it("credits coins and approves payment when Mercado Pago confirms approval", async () => {
    const pendingPayment = {
      id: 2,
      userId: 10,
      coinsAmount: 100,
      status: PixPaymentStatus.PENDING,
      externalId: "mp_456",
      expiresAt: new Date(Date.now() + 60_000),
      coinPackage: { name: "Pacote Básico" },
    };

    jest
      .spyOn(pixPaymentRepository, "findByExternalId")
      .mockResolvedValueOnce(pendingPayment as never)
      .mockResolvedValueOnce({
        ...pendingPayment,
        status: PixPaymentStatus.APPROVED,
        paidAt: new Date(),
      } as never);

    jest.spyOn(mercadoPagoClient, "getPayment").mockResolvedValue({
      id: "mp_456",
      status: "approved",
      qrCode: null,
      qrCodeBase64: null,
      ticketUrl: null,
    });

    const lockedPayment = {
      ...pendingPayment,
      coinPackage: { name: "Pacote Básico" },
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
            findUnique: jest.fn().mockResolvedValue({ coinBalance: 100 }),
          },
        };
        return callback(tx);
      },
    );

    const result = await service.confirmPayment("mp_456");

    expect(creditCoins).toHaveBeenCalledWith(
      10,
      100,
      expect.objectContaining({
        source: CoinTransactionSource.PIX_PURCHASE,
        externalId: "mp_payment_mp_456",
      }),
      expect.anything(),
    );
    expect(emitPaymentConfirmed).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        paymentId: 2,
        coinsAmount: 100,
        newBalance: 100,
      }),
    );
    expect(result).toEqual(approvedPayment);
  });
});
