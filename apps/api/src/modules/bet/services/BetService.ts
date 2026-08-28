import { BaseService } from "../../../core/base/BaseService";
import { BetRepository, BetWithOdds } from "../repositories/BetRepository";
import {
  CreateBetInput,
  UpdateBetInput,
} from "../../../core/validation/ValidationSchemas";
import {
  PaginationParams,
  PaginatedResult,
} from "../../../core/interfaces/IRepository";
import type { BetQueryInput } from "../../../core/validation/ValidationSchemas";
import { buildBetListWhere } from "../betListQuery";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../../../core/errors/AppError";
import { emitBetCreated, emitBetUpdated } from "../../../realtime/emitter";
import { toBetListItem } from "../mappers/bet.mapper";
import { cacheService } from "../../../core/cache/CacheService";
import { validateManualOddsValues } from "../../../utils/parimutuel";
import { enqueuePayoutJobs } from "../../../jobs/payout.worker";
import { resolveStatusAfterScheduleChange } from "../../../utils/betSchedule";
import { houseTreasuryService } from "../../coin/services/HouseTreasuryService";
import { CoinService } from "../../coin/services/CoinService";
import { CoinRepository } from "../../coin/repositories/CoinRepository";
import { UserStatsService } from "../../stats/services/UserStatsService";
import { prisma } from "../../../config/db";
import { CoinTransactionSource, VoteStatus } from "@prisma/client";

export class BetService extends BaseService<
  BetWithOdds,
  CreateBetInput,
  UpdateBetInput
> {
  constructor(private readonly betRepository: BetRepository) {
    super(betRepository);
  }

  async findAll(
    params?: PaginationParams & BetQueryInput,
  ): Promise<PaginatedResult<BetWithOdds>> {
    const pagination: PaginationParams = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      sortBy: params?.sortBy ?? "createdAt",
      sortOrder: params?.sortOrder ?? "desc",
    };

    const where = buildBetListWhere({
      status: params?.status,
      categoryId: params?.categoryId,
      search: params?.search,
      excludeExpired: params?.excludeExpired,
      queue: params?.queue,
    });

    return this.betRepository.findManyWithPagination(pagination, { where });
  }

  async findById(id: number): Promise<BetWithOdds> {
    this.validateId(id);

    if (process.env.NODE_ENV !== "test") {
      const cacheKey = `bet:${id}`;
      const cached = cacheService.get<BetWithOdds>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const bet = await this.betRepository.findUnique({ id });
    if (!bet) {
      throw new NotFoundError("Bet", id);
    }

    if (process.env.NODE_ENV !== "test") {
      cacheService.set(`bet:${id}`, bet, 30);
    }
    return bet;
  }

  async create(data: CreateBetInput): Promise<BetWithOdds> {
    await this.validateBusinessRules(data);

    // Validate that category exists (business rule)
    await this.validateCategoryExists(data.categoryId);

    const bet = await this.betRepository.create(data);
    const result = this.executeBusinessLogic
      ? await this.executeBusinessLogic(bet)
      : bet;

    cacheService.invalidatePattern("bets:");
    emitBetCreated(toBetListItem(result));
    return result;
  }

  async update(id: number, data: UpdateBetInput): Promise<BetWithOdds> {
    this.validateId(id);

    await this.validateBusinessRules(data);

    // Check if bet exists
    await this.handleNotFound(id, "Bet");

    // If updating odds, validate them
    if (data.odds) {
      const bet = await this.findById(id);
      this.validateOddsBelongToBet(bet, data.odds);
      this.validateOddsValues(data.odds);
    }

    // If updating category, validate it exists
    if (data.categoryId) {
      await this.validateCategoryExists(data.categoryId);
    }

    const existingBet = await this.findById(id);
    const nextStartTime =
      data.startTime !== undefined
        ? data.startTime
          ? new Date(data.startTime)
          : null
        : existingBet.startTime;
    const syncedStatus = resolveStatusAfterScheduleChange(
      existingBet.status,
      nextStartTime,
    );
    if (syncedStatus && !data.status) {
      data.status = syncedStatus;
    }

    const updatedBet = await this.betRepository.update({ id }, data);
    const result = this.executeBusinessLogic
      ? await this.executeBusinessLogic(updatedBet)
      : updatedBet;

    this.publishBetUpdate(result);
    return result;
  }

  async delete(id: number): Promise<void> {
    this.validateId(id);

    const bet = await this.findById(id);

    if (bet.totalVotes > 0) {
      if (bet.status === "closed" || bet.status === "resolved") {
        throw new ConflictError("Cannot delete bet that has votes");
      }

      await this.refundPendingVotes(id);
    }

    await this.betRepository.delete({ id });
    cacheService.invalidateBet(id);
  }

  private async refundPendingVotes(betId: number): Promise<void> {
    const coinRepository = new CoinRepository();
    const coinService = new CoinService(coinRepository);

    const pendingVotes = await prisma.vote.findMany({
      where: {
        odd: { betId },
        status: VoteStatus.pending,
      },
      select: { id: true, userId: true, amount: true },
    });

    if (pendingVotes.length === 0) {
      return;
    }

    await prisma.$transaction(async (tx) => {
      for (const vote of pendingVotes) {
        await coinService.creditCoins(
          vote.userId,
          vote.amount,
          {
            source: CoinTransactionSource.REFUND,
            referenceId: vote.id,
            externalId: `refund:vote:${vote.id}`,
            description: `Reembolso aposta ${betId} cancelada`,
          },
          tx,
        );

        await tx.vote.update({
          where: { id: vote.id },
          data: { status: VoteStatus.lost },
        });
      }
    });
  }

  async findByStatus(status: string): Promise<BetWithOdds[]> {
    if (status === "resolved" && process.env.NODE_ENV !== "test") {
      const cacheKey = `bets:status:resolved`;
      const cached = cacheService.get<BetWithOdds[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const bets = await this.betRepository.findByStatus(status);
      cacheService.set(cacheKey, bets, 120);
      return bets;
    }

    return this.betRepository.findByStatus(status);
  }

  async findByCategory(categoryId: number): Promise<BetWithOdds[]> {
    this.validateId(categoryId);
    return this.betRepository.findByCategory(categoryId);
  }

  async closeBet(id: number): Promise<BetWithOdds> {
    this.validateId(id);

    const bet = await this.findById(id);
    if (bet.status !== "open") {
      throw new ConflictError("Only open bets can be closed");
    }

    return this.update(id, { status: "closed" });
  }

  async resolveBet(id: number, winningOddId: number): Promise<BetWithOdds> {
    this.validateId(id);
    this.validateId(winningOddId);

    const bet = await this.findById(id);
    if (bet.status === "resolved") {
      throw new ConflictError("Aposta já foi resolvida");
    }

    const now = new Date();
    const isExpiredOpen =
      bet.status === "open" &&
      bet.closesAt != null &&
      bet.closesAt <= now;

    if (bet.status !== "closed" && !isExpiredOpen) {
      throw new ConflictError("Only closed bets can be resolved");
    }

    const winningOdd = bet.odds.find((odd) => odd.id === winningOddId);
    if (!winningOdd) {
      throw new BadRequestError("Winning odd does not belong to this bet");
    }

    await this.betRepository.executeTransaction(async (tx) => {
      if (isExpiredOpen) {
        await tx.bet.update({
          where: { id },
          data: { status: "closed" },
        });
      }

      await tx.odd.update({
        where: { id: winningOddId },
        data: { result: "won" },
      });

      await tx.odd.updateMany({
        where: {
          betId: id,
          id: { not: winningOddId },
        },
        data: { result: "lost" },
      });

      await tx.vote.updateMany({
        where: {
          odd: { betId: id, id: { not: winningOddId } },
          status: "pending",
        },
        data: { status: "lost" },
      });

      await tx.bet.update({
        where: { id },
        data: {
          status: "resolved",
          resolvedAt: now,
        },
      });

      await houseTreasuryService.creditTakeoutForBet(tx, id);
    });

    await enqueuePayoutJobs(id, winningOddId);

    const losingVotes = await prisma.vote.findMany({
      where: {
        odd: { betId: id, id: { not: winningOddId } },
        status: VoteStatus.lost,
      },
      select: { userId: true },
    });

    const userStatsService = new UserStatsService();
    await Promise.all(
      losingVotes.map((vote) => userStatsService.recordLoss(vote.userId)),
    );

    const resolved = await this.findById(id);
    this.publishBetUpdate(resolved);
    return resolved;
  }

  private publishBetUpdate(bet: BetWithOdds): void {
    cacheService.invalidateBet(bet.id);
    cacheService.del("bets:status:resolved");
    emitBetUpdated(toBetListItem(bet));
  }

  private validateOddsValues(odds: { value: number }[]): void {
    try {
      validateManualOddsValues(odds);
    } catch (error) {
      throw new BadRequestError(
        error instanceof Error ? error.message : "Invalid odds values",
      );
    }
  }

  private validateOddsBelongToBet(
    bet: BetWithOdds,
    odds: { id: number }[],
  ): void {
    const betOddIds = new Set(bet.odds.map((odd) => odd.id));

    for (const odd of odds) {
      if (!betOddIds.has(odd.id)) {
        throw new BadRequestError(
          `Odd with id ${odd.id} does not belong to this bet`,
        );
      }
    }
  }

  private async validateCategoryExists(categoryId: number): Promise<void> {
    const category = await this.betRepository.executeTransaction(async (tx) => {
      return tx.category.findUnique({
        where: { id: categoryId },
      });
    });

    if (!category) {
      throw new NotFoundError("Category", categoryId);
    }
  }
}
