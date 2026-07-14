import { useQuery, useMutation } from "../core/hooks";
import { queryCache } from "../core/hooks/useQueryCache";
import { betService } from "../services/BetService";
import { CreateBetDto, UpdateBetDto } from "../types/bet";

export const BETS_LIST_PARAMS = { limit: 100 } as const;

export function invalidateBetsQueries(): void {
  queryCache.clearByPrefix("bets-");
  queryCache.clearByPrefix("bet-");
}

export function useBets(params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
  categoryId?: number;
}) {
  return useQuery(
    `bets-${JSON.stringify(params || {})}`,
    () => betService.getBetsWithPagination(params),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes - longer cache
      refetchOnMount: false, // Don't refetch on mount if data exists
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  );
}

export function useBet(id: number) {
  return useQuery(`bet-${id}`, () => betService.getById(id), {
    enabled: !!id,
  });
}

export function useBetsByStatus(status: string) {
  return useQuery(
    `bets-status-${status}`,
    () => betService.getBetsByStatus(status),
    {
      enabled: !!status,
    },
  );
}

export function useBetsByCategory(categoryId: number) {
  return useQuery(
    `bets-category-${categoryId}`,
    () => betService.getBetsByCategory(categoryId),
    {
      enabled: !!categoryId,
    },
  );
}

export function useCreateBet() {
  return useMutation((data: CreateBetDto) => betService.create(data), {
    onSuccess: () => invalidateBetsQueries(),
  });
}

export function useUpdateBet() {
  return useMutation(
    ({ id, data }: { id: number; data: UpdateBetDto }) =>
      betService.update(id, data),
    { onSuccess: () => invalidateBetsQueries() },
  );
}

export function useDeleteBet() {
  return useMutation((id: number) => betService.delete(id), {
    onSuccess: () => invalidateBetsQueries(),
  });
}

export function useCloseBet() {
  return useMutation((id: number) => betService.closeBet(id), {
    onSuccess: () => invalidateBetsQueries(),
  });
}

export function useResolveBet() {
  return useMutation(
    ({ id, winningOddId }: { id: number; winningOddId: number }) =>
      betService.resolveBet(id, winningOddId),
    { onSuccess: () => invalidateBetsQueries() },
  );
}
