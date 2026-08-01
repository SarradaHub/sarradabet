import type {
  AnalyticsOverview,
  BetsByCategoryRow,
  PeakHourEntry,
  PixRevenuePoint,
} from "@sarradabet/types";
import {
  AnalyticsFilter,
  AnalyticsRepository,
} from "../repositories/AnalyticsRepository";

export class AnalyticsService {
  constructor(
    private readonly repository: AnalyticsRepository = new AnalyticsRepository(),
  ) {}

  getOverview(filter: AnalyticsFilter): Promise<AnalyticsOverview> {
    return this.repository.getOverview(filter);
  }

  getBetsByCategory(filter: AnalyticsFilter): Promise<BetsByCategoryRow[]> {
    return this.repository.getBetsByCategory(filter);
  }

  getPixRevenue(filter: AnalyticsFilter): Promise<PixRevenuePoint[]> {
    return this.repository.getPixRevenue(filter);
  }

  getPeakHours(filter: AnalyticsFilter): Promise<PeakHourEntry[]> {
    return this.repository.getPeakHours(filter);
  }

  streamExportRows(filter: AnalyticsFilter) {
    return this.repository.streamExportRows(filter);
  }

  refreshMaterializedViews(): Promise<void> {
    return this.repository.refreshMaterializedViews();
  }
}

export type { AnalyticsFilter };
