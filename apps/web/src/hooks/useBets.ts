import { useQuery, useMutation } from "../core/hooks";
import { queryCache } from "../core/hooks/useQueryCache";
import { betService } from "../services/BetService";
import { CreateBetDto, UpdateBetDto } from "../types/bet";

export const BETS_LIST_PARAMS = { limit: 100 } as const;

export const HOME_BETS_PARAMS = {
  status: "open,scheduled",
  excludeExpired: "true" as const,
  limit: 50,
  sortBy: "closesAt",
  sortOrder: "asc" as const,
};

export const RESOLUTION_QUEUE_PARAMS = {
  queue: "resolution" as const,
  limit: 50,
  sortBy: "closesAt",
  sortOrder: "asc" as const,
};

export function invalidateBetsQueries(): void {
  queryCache.clearByPrefix("bets-");
  queryCache.clearByPrefix("bet-");
}

export function useBets(
  params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    status?: string;
    categoryId?: number;
    search?: string;
    excludeExpired?: boolean | "true" | "false";
    queue?: "resolution";
  },
  options?: {
    staleTime?: number;
    refetchOnMount?: boolean;
    refetchOnWindowFocus?: boolean;
    enabled?: boolean;
  },
) {
  return useQuery(
    `bets-${JSON.stringify(params || {})}`,
    () => betService.getBetsWithPagination(params),
    {
      staleTime: options?.staleTime ?? 2 * 60 * 1000,
      refetchOnMount: options?.refetchOnMount ?? false,
      refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
      enabled: options?.enabled ?? true,
    },
  );
}

export function useAdminBets(params?: Parameters<typeof useBets>[0]) {
  return useBets(params, {
    staleTime: 30 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
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

export function useCloseBetsBatch() {
  return useMutation((ids: number[]) => betService.closeBetsBatch(ids), {
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
