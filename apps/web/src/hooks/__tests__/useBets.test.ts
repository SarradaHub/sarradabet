import { renderHook, waitFor, act } from "@testing-library/react";
import { vi } from "vitest";
import { useBets, useBet, useCreateBet } from "../useBets";
import { betService } from "../../services/BetService";
import { queryCache } from "../../core/hooks/useQueryCache";

// Mock the service
vi.mock("../../services/BetService", () => ({
  betService: {
    getBetsWithPagination: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockBetService = betService as unknown as {
  getBetsWithPagination: ReturnType<typeof vi.fn>;
  getById: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("useBets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCache.clear(); // Clear cache before each test
  });

  describe("useBets", () => {
    it("should fetch bets with pagination", async () => {
      const mockBets = [
        { id: 1, title: "Bet 1", totalVotes: 0 },
        { id: 2, title: "Bet 2", totalVotes: 5 },
      ];

      mockBetService.getBetsWithPagination.mockResolvedValue({
        success: true,
        data: mockBets,
        meta: {
          page: 1,
          limit: 10,
          total: 20,
          totalPages: 2,
          hasNext: true,
          hasPrev: false,
        },
      });

      const { result } = renderHook(() => useBets({ page: 1, limit: 10 }));

      await waitFor(() => {
        expect(result.current.data).toEqual(mockBets);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });

      expect(mockBetService.getBetsWithPagination).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it("should handle fetch error", async () => {
      const errorMessage = "Failed to fetch bets";
      mockBetService.getBetsWithPagination.mockRejectedValue({
        message: errorMessage,
      });

      const { result } = renderHook(() => useBets());

      await waitFor(() => {
        expect(result.current.data).toBe(null);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });

    it("should refetch data", async () => {
      const mockBets = [{ id: 1, title: "Bet 1", totalVotes: 0 }];
      mockBetService.getBetsWithPagination.mockResolvedValue({
        success: true,
        data: mockBets,
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });

      const { result } = renderHook(() => useBets());

      await waitFor(() => {
        expect(result.current.data).toEqual(mockBets);
      });

      // Clear cache to force refetch
      queryCache.clear(`bets-${JSON.stringify({})}`);

      // Refetch
      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockBetService.getBetsWithPagination).toHaveBeenCalledTimes(2);
    });
  });

  describe("useBet", () => {
    it("should fetch a single bet", async () => {
      const mockBet = { id: 1, title: "Single Bet", totalVotes: 0 };
      mockBetService.getById.mockResolvedValue({
        success: true,
        data: { bet: mockBet },
      });

      const { result } = renderHook(() => useBet(1));

      await waitFor(() => {
        expect(result.current.data).toEqual({ bet: mockBet });
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });

      expect(mockBetService.getById).toHaveBeenCalledWith(1);
    });

    it("should not fetch when id is 0", () => {
      const { result } = renderHook(() => useBet(0));

      expect(mockBetService.getById).not.toHaveBeenCalled();
      expect(result.current.data).toBe(null);
    });
  });

  describe("useCreateBet", () => {
    it("should create a bet successfully", async () => {
      const mockBetData = {
        title: "New Bet",
        description: "New Description",
        categoryId: 1,
        odds: [{ title: "Option 1", value: 2.0 }],
      };

      const mockCreatedBet = { id: 1, ...mockBetData, totalVotes: 0 };
      mockBetService.create.mockResolvedValue({
        success: true,
        data: { bet: mockCreatedBet },
      });

      const { result } = renderHook(() => useCreateBet());

      await act(async () => {
        const response = await result.current.mutateAsync(mockBetData);
        expect(response).toEqual({ bet: mockCreatedBet });
      });

      await waitFor(() => {
        expect(result.current.data).toEqual({ bet: mockCreatedBet });
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockBetService.create).toHaveBeenCalledWith(mockBetData);
    });

    it("should handle creation error", async () => {
      const errorMessage = "Failed to create bet";
      const mockBetData = {
        title: "New Bet",
        categoryId: 1,
        odds: [{ title: "Option 1", value: 2.0 }],
      };

      mockBetService.create.mockRejectedValue({
        message: errorMessage,
      });

      const { result } = renderHook(() => useCreateBet());

      await act(async () => {
        const response = await result.current.mutateAsync(mockBetData);
        expect(response).toBe(null);
      });

      await waitFor(() => {
        expect(result.current.data).toBe(null);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.isError).toBe(true);
      });
    });

    it("should reset mutation state", () => {
      const { result } = renderHook(() => useCreateBet());

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isIdle).toBe(true);
    });
  });
});
