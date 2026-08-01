import { useCallback, useEffect, useState } from "react";
import type { LeaderboardEntry } from "@sarradabet/types";
import { statsService } from "../services/statsService";

export function useLeaderboard(limit = 100) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await statsService.getLeaderboard(limit);
      setEntries(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar ranking",
      );
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { entries, loading, error, refetch };
}
