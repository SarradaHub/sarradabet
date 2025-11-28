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

    const bet = await this.betRepository.findUnique({ id });
    if (!bet) {
      throw new NotFoundError("Bet", id);
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
    return this.executeBusinessLogic
      ? await this.executeBusinessLogic(bet)
      : bet;
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
    return this.executeBusinessLogic
      ? await this.executeBusinessLogic(updatedBet)
      : updatedBet;
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
  }

  async findByStatus(status: string): Promise<BetWithOdds[]> {
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

    return this.findById(id);
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
