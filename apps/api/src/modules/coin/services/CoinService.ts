import {
  CoinTransaction,
  CoinTransactionSource,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../../config/db";
import { BadRequestError } from "../../../core/errors/AppError";
import { PaginationParams } from "../../../core/interfaces/IRepository";
import {
  CoinRepository,
  CreditDebitMetadata,
} from "../repositories/CoinRepository";
import { invalidateDashboardCache } from "../../dashboard/services/DashboardService";

export class CoinService {
  constructor(private readonly coinRepository: CoinRepository = new CoinRepository()) {}

  async getBalance(userId: number): Promise<{ balance: number }> {
    const balance = await this.coinRepository.getBalance(userId);
    return { balance };
  }

  async listTransactions(userId: number, params: PaginationParams) {
    return this.coinRepository.listTransactions(userId, params);
  }

  async creditCoins(
    userId: number,
    amount: number,
    metadata: CreditDebitMetadata,
    txClient?: Prisma.TransactionClient,
  ): Promise<CoinTransaction> {
    if (amount <= 0) {
      throw new BadRequestError("Amount must be greater than zero");
    }

    if (metadata.externalId) {
      const existing = await this.coinRepository.findTransactionByExternalId(
        metadata.externalId,
      );
      if (existing) {
        return existing;
      }
    }

    if (txClient) {
      const result = await this.coinRepository.creditCoins(
        txClient,
        userId,
        amount,
        metadata,
      );
      await invalidateDashboardCache(userId);
      return result;
    }

    const result = await prisma.$transaction(async (tx) =>
      this.coinRepository.creditCoins(tx, userId, amount, metadata),
    );
    await invalidateDashboardCache(userId);
    return result;
  }

  async debitCoins(
    userId: number,
    amount: number,
    metadata: CreditDebitMetadata,
    txClient?: Prisma.TransactionClient,
  ): Promise<CoinTransaction> {
    if (amount <= 0) {
      throw new BadRequestError("Amount must be greater than zero");
    }

    try {
      if (txClient) {
        const result = await this.coinRepository.debitCoins(
          txClient,
          userId,
          amount,
          metadata,
        );
        await invalidateDashboardCache(userId);
        return result;
      }

      const result = await prisma.$transaction(async (tx) =>
        this.coinRepository.debitCoins(tx, userId, amount, metadata),
      );
      await invalidateDashboardCache(userId);
      return result;
    } catch (error) {
      if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
        throw new BadRequestError("Saldo insuficiente");
      }
      throw error;
    }
  }
}
