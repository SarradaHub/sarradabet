import type { UserRewardRedemption } from "@sarradabet/types";
import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../utils/apiError";
import { rewardService } from "../services/rewardService";
import { useAuth } from "./useAuth";

export function useMyPendingRedemptions() {
  const { isAuthenticated } = useAuth();
  const [redemptions, setRedemptions] = useState<UserRewardRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) {
      setRedemptions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await rewardService.getMyPendingRedemptions();
      setRedemptions(result);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao carregar resgates"));
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

    window.addEventListener("reward:redeemed", handleRefresh);
    window.addEventListener("reward:validated", handleRefresh);

    return () => {
      window.removeEventListener("reward:redeemed", handleRefresh);
      window.removeEventListener("reward:validated", handleRefresh);
    };
  }, [refetch]);

  return { redemptions, loading, error, refetch };
}
