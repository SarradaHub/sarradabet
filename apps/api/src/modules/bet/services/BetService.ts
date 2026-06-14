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
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../../../core/errors/AppError";
import { emitBetCreated, emitBetUpdated } from "../../../realtime/emitter";
import { toBetListItem } from "../mappers/bet.mapper";
import { cacheService } from "../../../core/cache/CacheService";

export class BetService extends BaseService<
  BetWithOdds,
  CreateBetInput,
  UpdateBetInput
> {
  constructor(private readonly betRepository: BetRepository) {
    super(betRepository);
  }

  async findAll(
    params?: PaginationParams,
  ): Promise<PaginatedResult<BetWithOdds>> {
    return this.betRepository.findManyWithPagination(
      params || {
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      },
    );
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

    // Validate that odds values are reasonable
    this.validateOddsValues(data.odds);

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
      this.validateOddsValues(data.odds);
    }

    // If updating category, validate it exists
    if (data.categoryId) {
      await this.validateCategoryExists(data.categoryId);
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

    // Check if bet exists
    await this.handleNotFound(id, "Bet");

    // Business rule: Cannot delete bets that have votes
    const bet = await this.findById(id);
    if (bet.totalVotes > 0) {
      throw new ConflictError("Cannot delete bet that has votes");
    }

    await this.betRepository.delete({ id });
    cacheService.invalidateBet(id);
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
      throw new ConflictError("Bet is already resolved");
    }

    // Validate that the winning odd belongs to this bet
    const winningOdd = bet.odds.find((odd) => odd.id === winningOddId);
    if (!winningOdd) {
      throw new BadRequestError("Winning odd does not belong to this bet");
    }

    // Update all odds with their results
    await this.betRepository.executeTransaction(async (tx) => {
      // Mark winning odd as won
      await tx.odd.update({
        where: { id: winningOddId },
        data: { result: "won" },
      });

      // Mark other odds as lost
      await tx.odd.updateMany({
        where: {
          betId: id,
          id: { not: winningOddId },
        },
        data: { result: "lost" },
      });

      // Mark bet as resolved
      await tx.bet.update({
        where: { id },
        data: {
          status: "resolved",
          resolvedAt: new Date(),
        },
      });
    });

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
    // First validate bounds to provide the most specific error
    if (odds.some((odd) => odd.value < 1.01 || odd.value > 1000)) {
      throw new BadRequestError("Odds values must be between 1.01 and 1000");
    }

    // Then validate aggregated probability realism
    const totalProbability = odds.reduce((sum, odd) => sum + 1 / odd.value, 0);

    if (totalProbability < 0.8 || totalProbability > 1.2) {
      throw new BadRequestError(
        "Odds values do not represent realistic probabilities",
      );
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
