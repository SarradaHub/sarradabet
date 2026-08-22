import { useCallback, useEffect, useState } from "react";
import type {
  AnalyticsOverview,
  BetsByCategoryRow,
  PeakHourEntry,
  PixRevenuePoint,
} from "@sarradabet/types";
import { getApiErrorMessage } from "../utils/apiError";
import {
  analyticsService,
  type AnalyticsFilters,
} from "../services/analyticsService";

export function useAnalytics(filters: AnalyticsFilters) {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [betsByCategory, setBetsByCategory] = useState<BetsByCategoryRow[]>([]);
  const [pixRevenue, setPixRevenue] = useState<PixRevenuePoint[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHourEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewData, categoryData, revenueData, hoursData] =
        await Promise.all([
          analyticsService.getOverview(filters),
          analyticsService.getBetsByCategory(filters),
          analyticsService.getPixRevenue(filters),
          analyticsService.getPeakHours(filters),
        ]);
      setOverview(overviewData);
      setBetsByCategory(categoryData);
      setPixRevenue(revenueData);
      setPeakHours(hoursData);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao carregar análises"));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    overview,
    betsByCategory,
    pixRevenue,
    peakHours,
    loading,
    error,
    refetch,
  };
}
