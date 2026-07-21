import {
  CoinTransaction,
  CoinTransactionSource,
  CoinTransactionType,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../../config/db";
import { PaginationParams } from "../../../core/interfaces/IRepository";

export interface CreditDebitMetadata {
  source: CoinTransactionSource;
  referenceId?: number;
  externalId?: string;
  description?: string;
}

export class CoinRepository {
  async getBalance(userId: number): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coinBalance: true },
    });
    return user?.coinBalance ?? 0;
  }

  async findTransactionByExternalId(
    externalId: string,
  ): Promise<CoinTransaction | null> {
    return prisma.coinTransaction.findUnique({
      where: { externalId },
    });
  }

  async listTransactions(userId: number, params: PaginationParams) {
    const skip = (params.page - 1) * params.limit;

    const [items, total] = await Promise.all([
      prisma.coinTransaction.findMany({
        where: { userId },
        orderBy: { [params.sortBy ?? "createdAt"]: params.sortOrder ?? "desc" },
        skip,
        take: params.limit,
      }),
      prisma.coinTransaction.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async creditCoins(
    tx: Prisma.TransactionClient,
    userId: number,
    amount: number,
    metadata: CreditDebitMetadata,
  ): Promise<CoinTransaction> {
    const user = await tx.user.update({
      where: { id: userId },
      data: { coinBalance: { increment: amount } },
      select: { coinBalance: true },
    });

    return tx.coinTransaction.create({
      data: {
        userId,
        type: CoinTransactionType.CREDIT,
        amount,
        balanceAfter: user.coinBalance,
        source: metadata.source,
        referenceId: metadata.referenceId,
        externalId: metadata.externalId,
        description: metadata.description,
      },
    });
  }

  async debitCoins(
    tx: Prisma.TransactionClient,
    userId: number,
    amount: number,
    metadata: CreditDebitMetadata,
  ): Promise<CoinTransaction> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { coinBalance: true },
    });

    if (!user || user.coinBalance < amount) {
      throw new Error("INSUFFICIENT_BALANCE");
    }

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { coinBalance: { decrement: amount } },
      select: { coinBalance: true },
    });

    return tx.coinTransaction.create({
      data: {
        userId,
        type: CoinTransactionType.DEBIT,
        amount,
        balanceAfter: updatedUser.coinBalance,
        source: metadata.source,
        referenceId: metadata.referenceId,
        externalId: metadata.externalId,
        description: metadata.description,
      },
    });
  }
}
