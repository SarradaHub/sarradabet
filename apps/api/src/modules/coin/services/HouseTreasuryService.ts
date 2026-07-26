import {
  CoinTransactionSource,
  Prisma,
  UserRole,
} from "@prisma/client";
import { prisma } from "../../../config/db";
import { config } from "../../../config/env";
import { CoinRepository } from "../repositories/CoinRepository";
import { calculateTakeout } from "../../../utils/parimutuel";
import { hashPassword } from "../../../utils/auth";

const coinRepository = new CoinRepository();

function takeoutExternalId(betId: number): string {
  return `takeout:bet:${betId}`;
}

export class HouseTreasuryService {
  async getHouseUserId(
    tx: Prisma.TransactionClient = prisma,
  ): Promise<number> {
    const username = config.HOUSE_USER_USERNAME;
    const existing = await tx.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existing) {
      return existing.id;
    }

    const passwordHash = await hashPassword(
      `house-system-${username}-${Date.now()}`,
    );
    const created = await tx.user.create({
      data: {
        username,
        email: `${username}@internal.sarradabet.local`,
        phone: "5500000000000",
        passwordHash,
        role: UserRole.USER,
        coinBalance: 0,
      },
      select: { id: true },
    });

    return created.id;
  }

  async creditTakeoutForBet(
    tx: Prisma.TransactionClient,
    betId: number,
  ): Promise<number> {
    const externalId = takeoutExternalId(betId);
    const existing = await coinRepository.findTransactionByExternalId(
      externalId,
    );
    if (existing) {
      return 0;
    }

    const poolAggregate = await tx.vote.aggregate({
      where: { odd: { betId } },
      _sum: { amount: true },
    });
    const totalPool = poolAggregate._sum.amount ?? 0;
    const takeoutAmount = calculateTakeout(totalPool);

    if (takeoutAmount <= 0) {
      return 0;
    }

    const houseUserId = await this.getHouseUserId(tx);
    await coinRepository.creditCoins(tx, houseUserId, takeoutAmount, {
      source: CoinTransactionSource.TAKEOUT,
      referenceId: betId,
      externalId,
      description: `Takeout aposta ${betId}`,
    });

    return takeoutAmount;
  }

  async getSummary(): Promise<{
    balance: number;
    takeoutRate: number;
    takeoutPercent: number;
  }> {
    const username = config.HOUSE_USER_USERNAME;
    const houseUser = await prisma.user.findUnique({
      where: { username },
      select: { coinBalance: true },
    });

    const takeoutRate = config.BET_TAKEOUT_RATE;

    return {
      balance: houseUser?.coinBalance ?? 0,
      takeoutRate,
      takeoutPercent: Math.round(takeoutRate * 1000) / 10,
    };
  }
}

export const houseTreasuryService = new HouseTreasuryService();
