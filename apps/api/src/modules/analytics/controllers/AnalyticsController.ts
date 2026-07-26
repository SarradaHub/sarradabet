import { NextFunction, Request, Response } from "express";
import {
  AnalyticsExportQueryInput,
  AnalyticsQueryInput,
} from "../../../core/validation/ValidationSchemas";
import { ApiResponse } from "../../../utils/api/response";
import { AnalyticsService } from "../services/AnalyticsService";

function toFilter(query: AnalyticsQueryInput) {
  return {
    startDate: query.startDate,
    endDate: query.endDate,
    categoryId: query.categoryId,
  };
}

function escapeCsvValue(value: string | number): string {
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService = new AnalyticsService(),
  ) {}

  getOverview = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = req.query as unknown as AnalyticsQueryInput;
      const overview = await this.analyticsService.getOverview(toFilter(query));
      new ApiResponse(res).success({ ...overview });
    } catch (error) {
      next(error);
    }
  };

  getBetsByCategory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = req.query as unknown as AnalyticsQueryInput;
      const rows = await this.analyticsService.getBetsByCategory(
        toFilter(query),
      );
      new ApiResponse(res).success(rows);
    } catch (error) {
      next(error);
    }
  };

  getPixRevenue = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = req.query as unknown as AnalyticsQueryInput;
      const points = await this.analyticsService.getPixRevenue(toFilter(query));
      new ApiResponse(res).success(points);
    } catch (error) {
      next(error);
    }
  };

  getPeakHours = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = req.query as unknown as AnalyticsQueryInput;
      const hours = await this.analyticsService.getPeakHours(toFilter(query));
      new ApiResponse(res).success(hours);
    } catch (error) {
      next(error);
    }
  };

  exportCsv = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = req.query as unknown as AnalyticsExportQueryInput;
      const filename = `analytics_${query.startDate}_${query.endDate}.csv`;

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );

      const headers = [
        "day",
        "categoryId",
        "categoryName",
        "betCount",
        "coinVolume",
        "revenueCents",
        "paymentCount",
      ];
      res.write(`${headers.join(",")}\n`);

      for await (const row of this.analyticsService.streamExportRows(
        toFilter(query),
      )) {
        const line = [
          row.day,
          row.categoryId,
          escapeCsvValue(row.categoryName),
          row.betCount,
          row.coinVolume,
          row.revenueCents,
          row.paymentCount,
        ].join(",");
        res.write(`${line}\n`);
      }

      res.end();
    } catch (error) {
      next(error);
    }
  };
}
