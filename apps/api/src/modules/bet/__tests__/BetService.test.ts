import { BetService } from "../services/BetService";
import { BetRepository } from "../repositories/BetRepository";
import { PrismaClient } from "@prisma/client";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../../../core/errors/AppError";
import { betWithOddsFactory } from "../../../__tests__/factories";
import { BetStatus } from "../../../types/bet.types";

// Mock the repository
jest.mock("../repositories/BetRepository");

describe("BetService", () => {
  let betService: BetService;
  let mockRepository: jest.Mocked<BetRepository>;
  let mockPrisma: Partial<jest.Mocked<PrismaClient>>;

  beforeEach(() => {
    mockPrisma = {
      category: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    } as unknown as jest.Mocked<PrismaClient>;

    mockRepository = {
      findManyWithPagination: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findByStatus: jest.fn(),
      findByCategory: jest.fn(),
      executeTransaction: jest.fn(),
      prisma: mockPrisma,
    } as unknown as jest.Mocked<BetRepository>;

    betService = new BetService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("should return bet when found", async () => {
      const mockBet: any = betWithOddsFactory.build({ id: 1 });
      mockRepository.findUnique.mockResolvedValue(mockBet as any);

      const result = await betService.findById(1);

      expect(result).toBe(mockBet);
      expect(mockRepository.findUnique).toHaveBeenCalledWith({ id: 1 });
    });

    it("should throw NotFoundError when bet not found", async () => {
      mockRepository.findUnique.mockResolvedValue(null);

      await expect(betService.findById(999)).rejects.toThrow(NotFoundError);
      await expect(betService.findById(999)).rejects.toThrow(
        "Bet with id 999 not found",
      );
    });

    it("should throw error for invalid ID", async () => {
      await expect(betService.findById(0)).rejects.toThrow(
        "Invalid ID provided",
      );
      await expect(betService.findById(-1)).rejects.toThrow(
        "Invalid ID provided",
      );
    });
  });

  describe("create", () => {
    const mockCreateData = {
      title: "Test Bet",
      description: "Test Description",
      categoryId: 1,
      odds: [
        { title: "Option 1", value: 2.0 },
        { title: "Option 2", value: 3.0 },
      ],
    };

    it("should create bet successfully", async () => {
      const mockCreatedBet: any = betWithOddsFactory.build({
        id: 1,
        odds: [
          { id: 1, title: "Option 1", value: 2.0 },
          { id: 2, title: "Option 2", value: 3.0 },
        ],
      });
      mockRepository.create.mockResolvedValue(mockCreatedBet as any);
      mockRepository.executeTransaction.mockResolvedValue({ id: 1 });

      const result = await betService.create(mockCreateData);

      expect(result).toBe(mockCreatedBet);
      expect(mockRepository.create).toHaveBeenCalledWith(mockCreateData);
    });

    it("should throw BadRequestError for invalid odds values", async () => {
      const invalidData = {
        ...mockCreateData,
        odds: [
          { title: "Option 1", value: 0.5 }, // too low triggers min/max error
          { title: "Option 2", value: 2.0 },
        ],
      };

      await expect(betService.create(invalidData)).rejects.toThrow(
        BadRequestError,
      );
      await expect(betService.create(invalidData)).rejects.toThrow(
        "Odds values must be between 1.01 and 1000",
      );
    });

    it("should throw BadRequestError for unrealistic probabilities", async () => {
      const invalidData = {
        ...mockCreateData,
        odds: [
          { title: "Option 1", value: 1.1 }, // Very high probability
          { title: "Option 2", value: 1.1 }, // Very high probability
        ],
      };

      await expect(betService.create(invalidData)).rejects.toThrow(
        BadRequestError,
      );
      await expect(betService.create(invalidData)).rejects.toThrow(
        "Odds values do not represent realistic probabilities",
      );
    });

    it("should throw NotFoundError when category does not exist", async () => {
      mockRepository.executeTransaction.mockResolvedValue(null);

      await expect(betService.create(mockCreateData)).rejects.toThrow();
      await expect(betService.create(mockCreateData)).rejects.toThrow(
        "Category with id 1 not found",
      );
    });
  });

  describe("update", () => {
    const mockUpdateData = {
      title: "Updated Bet Title",
    };

    it("should update bet successfully", async () => {
      const mockUpdatedBet: any = betWithOddsFactory.build({
        id: 1,
        title: "Updated Bet Title",
      });
      mockRepository.findUnique.mockResolvedValue({ id: 1 } as any); // Bet exists
      mockRepository.update.mockResolvedValue(mockUpdatedBet as any);

      const result = await betService.update(1, mockUpdateData);

      expect(result).toBe(mockUpdatedBet);
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        mockUpdateData,
      );
    });

    it("should throw NotFoundError when bet does not exist", async () => {
      mockRepository.findUnique.mockResolvedValue(null);

      await expect(betService.update(999, mockUpdateData)).rejects.toThrow(
        NotFoundError,
      );
      await expect(betService.update(999, mockUpdateData)).rejects.toThrow(
        "Bet with id 999 not found",
      );
    });
  });

  describe("delete", () => {
    it("should delete bet successfully", async () => {
      const mockBet: any = betWithOddsFactory.build({ id: 1 });
      mockRepository.findUnique.mockResolvedValue(mockBet as any);
      mockRepository.delete.mockResolvedValue(mockBet as any);

      await betService.delete(1);

      expect(mockRepository.delete).toHaveBeenCalledWith({ id: 1 });
    });

    it("should throw ConflictError when bet has votes", async () => {
      const mockBet: any = { id: 1, title: "Test Bet", totalVotes: 5 };
      mockRepository.findUnique.mockResolvedValue(mockBet as any);

      await expect(betService.delete(1)).rejects.toThrow(ConflictError);
      await expect(betService.delete(1)).rejects.toThrow(
        "Cannot delete bet that has votes",
      );
    });
  });

  describe("closeBet", () => {
    it("should close bet successfully", async () => {
      const mockBet: any = betWithOddsFactory.build({
        id: 1,
        status: BetStatus.open,
      });
      const mockClosedBet: any = { ...mockBet, status: BetStatus.closed };

      mockRepository.findUnique.mockResolvedValue(mockBet as any);
      mockRepository.update.mockResolvedValue(mockClosedBet as any);

      const result = await betService.closeBet(1);

      expect(result).toBe(mockClosedBet);
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        { status: BetStatus.closed },
      );
    });

    it("should throw ConflictError when bet is not open", async () => {
      const mockBet: any = betWithOddsFactory.build({
        id: 1,
        status: BetStatus.closed,
      });
      mockRepository.findUnique.mockResolvedValue(mockBet as any);

      await expect(betService.closeBet(1)).rejects.toThrow(ConflictError);
      await expect(betService.closeBet(1)).rejects.toThrow(
        "Only open bets can be closed",
      );
    });
  });

  describe("resolveBet", () => {
    it("should resolve bet successfully", async () => {
      const mockBet: any = betWithOddsFactory.build({
        id: 1,
        status: BetStatus.open,
        odds: [
          { id: 1, title: "Option 1", value: 2.0 },
          { id: 2, title: "Option 2", value: 3.0 },
        ],
      });

      const mockResolvedBet: any = { ...mockBet, status: BetStatus.resolved };
      mockRepository.findUnique.mockResolvedValue(mockBet as any);
      mockRepository.executeTransaction.mockResolvedValue(undefined);
      mockRepository.findUnique
        .mockResolvedValueOnce(mockBet as any)
        .mockResolvedValueOnce(mockResolvedBet as any);

      const result = await betService.resolveBet(1, 1);

      expect(result).toBe(mockResolvedBet);
      expect(mockRepository.executeTransaction).toHaveBeenCalled();
    });

    it("should throw ConflictError when bet is already resolved", async () => {
      const mockBet: any = betWithOddsFactory.build({
        id: 1,
        status: BetStatus.resolved,
        odds: [{ id: 1, title: "Option 1", value: 2.0 }],
      });
      mockRepository.findUnique.mockResolvedValue(mockBet as any);

      await expect(betService.resolveBet(1, 1)).rejects.toThrow(ConflictError);
      await expect(betService.resolveBet(1, 1)).rejects.toThrow(
        "Bet is already resolved",
      );
    });

    it("should throw BadRequestError when winning odd does not belong to bet", async () => {
      const mockBet = {
        id: 1,
        title: "Test Bet",
        status: "open",
        odds: [{ id: 1, title: "Option 1", value: 2.0 }],
        totalVotes: 0,
      };
      mockRepository.findUnique.mockResolvedValue(mockBet as any);

      await expect(betService.resolveBet(1, 999)).rejects.toThrow(
        BadRequestError,
      );
      await expect(betService.resolveBet(1, 999)).rejects.toThrow(
        "Winning odd does not belong to this bet",
      );
    });
  });
});
