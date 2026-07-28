import { logger } from "../utils/logger";
import { AnalyticsService } from "../modules/analytics/services/AnalyticsService";

export async function refreshAnalyticsMaterializedViews(): Promise<void> {
  const analyticsService = new AnalyticsService();
  await analyticsService.refreshMaterializedViews();
  logger.info("Analytics materialized views refreshed");
}
