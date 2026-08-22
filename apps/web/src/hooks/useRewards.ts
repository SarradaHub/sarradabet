import { useCallback, useEffect, useState } from "react";
import type { Reward } from "@sarradabet/types";
import { getApiErrorMessage } from "../utils/apiError";
import { rewardService } from "../services/rewardService";

export function useRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await rewardService.listActive();
      setRewards(result);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao carregar recompensas"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { rewards, loading, error, refetch };
}
