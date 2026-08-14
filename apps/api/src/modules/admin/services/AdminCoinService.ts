import { CoinTransactionSource } from "@prisma/client";
import type { AdjustCoinsRequest, AdjustCoinsResponse } from "@sarradabet/types";
import { prisma } from "../../../config/db";
import { NotFoundError } from "../../../core/errors/AppError";
import { CoinService } from "../../coin/services/CoinService";
import { AdminAuditLogRepository } from "../repositories/AdminAuditLogRepository";

export class AdminCoinService {
  constructor(
    private readonly coinService: CoinService = new CoinService(),
    private readonly auditRepo: AdminAuditLogRepository = new AdminAuditLogRepository(),
  ) {}

  async adjustBalance(
    adminId: number,
    targetUserId: number,
    dto: AdjustCoinsRequest,
  ): Promise<AdjustCoinsResponse> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: targetUserId } });
      if (!user) {
        throw new NotFoundError("User not found");
      }

      const balanceBefore = user.coinBalance;

      const metadata = {
        source: CoinTransactionSource.ADMIN_ADJUSTMENT,
        referenceId: adminId,
        description: dto.reason,
      };

      const txn =
        dto.direction === "credit"
          ? await this.coinService.creditCoins(
              targetUserId,
              dto.amount,
              metadata,
              tx,
            )
          : await this.coinService.debitCoins(
              targetUserId,
              dto.amount,
              metadata,
              tx,
            );

      const updated = await tx.user.findUniqueOrThrow({
        where: { id: targetUserId },
      });

      await this.auditRepo.create(tx, {
        adminId,
        action: "COIN_ADJUST",
        targetUserId,
        payload: {
          amount: dto.amount,
          direction: dto.direction,
          reason: dto.reason,
          balanceBefore,
          balanceAfter: updated.coinBalance,
        },
      });

      return { balance: updated.coinBalance, transactionId: txn.id };
    });
  }
}
