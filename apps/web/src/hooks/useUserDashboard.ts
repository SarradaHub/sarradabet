import { useCallback, useEffect, useState } from "react";
import type { UserDashboardResponse } from "@sarradabet/types";
import { dashboardService } from "../services/dashboardService";
import { useAuth } from "./useAuth";

export function useUserDashboard(page = 1, limit = 10) {
  const { isAuthenticated } = useAuth();
  const [dashboard, setDashboard] = useState<UserDashboardResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) {
      setDashboard(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getDashboard({ page, limit });
      setDashboard(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page, limit]);

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

  return { dashboard, loading, error, refetch };
}
