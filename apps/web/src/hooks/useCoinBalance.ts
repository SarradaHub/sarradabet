import { useCallback, useEffect, useState } from "react";
import { coinService } from "../services/CoinPaymentService";
import { useAuth } from "./useAuth";

export function useCoinBalance() {
  const { isAuthenticated } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) {
      setBalance(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await coinService.getBalance();
      setBalance(result.balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load balance");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { balance, loading, error, refetch, setBalance };
}
