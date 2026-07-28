import { useCallback, useEffect, useState } from "react";
import type { UserStats } from "@sarradabet/types";
import { statsService } from "../services/statsService";
import { useAuth } from "./useAuth";

export function useUserStats() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await statsService.getMyStats();
      setStats(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar estatísticas",
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const handleRefresh = () => {
      void refetch();
    };

    window.addEventListener("bet:resolved", handleRefresh);
    window.addEventListener("reward:redeemed", handleRefresh);

    return () => {
      window.removeEventListener("bet:resolved", handleRefresh);
      window.removeEventListener("reward:redeemed", handleRefresh);
    };
  }, [refetch]);

  return { stats, loading, error, refetch };
}
