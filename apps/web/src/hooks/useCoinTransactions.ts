import { useCallback, useEffect, useState } from "react";
import type { CoinTransaction } from "@sarradabet/types";
import { coinService } from "../services/CoinPaymentService";
import { useAuth } from "./useAuth";

export function useCoinTransactions(limit = 10) {
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) {
      setTransactions([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await coinService.getTransactions({ page: 1, limit });
      setTransactions(result.data.items);
      setTotal(result.data.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load transactions",
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, limit]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { transactions, total, loading, error, refetch };
}
