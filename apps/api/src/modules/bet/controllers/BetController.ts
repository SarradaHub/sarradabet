import { Request, Response, NextFunction } from "express";
import { BaseController } from "../../../core/base/BaseController";
import { BetService } from "../services/BetService";
import {
  CreateBetInput,
  UpdateBetInput,
} from "../../../core/validation/ValidationSchemas";
import { BetWithOdds } from "../repositories/BetRepository";

export class BetController extends BaseController<
  BetWithOdds,
  CreateBetInput,
  UpdateBetInput
> {
  constructor(private readonly betService: BetService) {
    super(betService);
  }

  async findAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const params = this.parsePaginationParams(req);
      const result = await this.betService.findAll(params);
      this.sendSuccess(res, result, 200, "Bets retrieved successfully");
    } catch (error) {
      this.handleError(error as Error, res, next);
    }
  }

  async findById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = this.parseId(req);
      const bet = await this.betService.findById(id);

      this.sendSuccess(res, { bet }, 200, "Bet retrieved successfully");
    } catch (error) {
      this.handleError(error as Error, res, next);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const betData = req.body as CreateBetInput;
      const newBet = await this.betService.create(betData);

      this.sendSuccess(res, { bet: newBet }, 201, "Bet created successfully");
    } catch (error) {
      this.handleError(error as Error, res, next);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = this.parseId(req);
      const updateData = req.body as UpdateBetInput;
      const updatedBet = await this.betService.update(id, updateData);

      this.sendSuccess(
        res,
        { bet: updatedBet },
        200,
        "Bet updated successfully",
      );
    } catch (error) {
      this.handleError(error as Error, res, next);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = this.parseId(req);
      await this.betService.delete(id);

      this.sendSuccess(res, {}, 200, "Bet deleted successfully");
    } catch (error) {
      this.handleError(error as Error, res, next);
    }
  }

  async findByStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { status } = req.params;
      const bets = await this.betService.findByStatus(status);
      this.sendSuccess(
        res,
        { data: bets },
        200,
        `Bets with status '${status}' retrieved successfully`,
      );
    } catch (error) {
      this.handleError(error as Error, res, next);
    }
  }

  async findByCategory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const categoryId = this.parseId(req);
      const bets = await this.betService.findByCategory(categoryId);
      this.sendSuccess(
        res,
        { data: bets },
        200,
        "Bets by category retrieved successfully",
      );
    } catch (error) {
      this.handleError(error as Error, res, next);
    }
  }

  async closeBet(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = this.parseId(req);
      const closedBet = await this.betService.closeBet(id);

      this.sendSuccess(res, { bet: closedBet }, 200, "Bet closed successfully");
    } catch (error) {
      this.handleError(error as Error, res, next);
    }
  }

  async resolveBet(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = this.parseId(req);
      const { winningOddId } = req.body;

      if (!winningOddId || typeof winningOddId !== "number") {
        this.sendError(res, "Winning odd ID is required", 400);
        return;
      }

      const resolvedBet = await this.betService.resolveBet(id, winningOddId);

      this.sendSuccess(
        res,
        { bet: resolvedBet },
        200,
        "Bet resolved successfully",
      );
    } catch (error) {
      this.handleError(error as Error, res, next);
    }
  }
}
