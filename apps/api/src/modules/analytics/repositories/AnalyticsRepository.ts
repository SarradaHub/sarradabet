import type {
  AnalyticsOverview,
  BetsByCategoryRow,
  PeakHourEntry,
  PixRevenuePoint,
} from "@sarradabet/types";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../config/db";

export interface AnalyticsFilter {
  startDate: string;
  endDate: string;
  categoryId?: number;
}

function toDateRange(filter: AnalyticsFilter) {
  const start = new Date(`${filter.startDate}T00:00:00.000Z`);
  const end = new Date(`${filter.endDate}T23:59:59.999Z`);
  return { start, end };
}

export class AnalyticsRepository {
  async getOverview(filter: AnalyticsFilter): Promise<AnalyticsOverview> {
    const { start, end } = toDateRange(filter);
    const categoryFilter = filter.categoryId
      ? Prisma.sql`AND b."categoryId" = ${filter.categoryId}`
      : Prisma.empty;

    const [betStats, activeUsers, pixRevenue] = await Promise.all([
      prisma.$queryRaw<
        { total_bets: bigint; total_coin_volume: bigint }[]
      >(Prisma.sql`
        SELECT
          COUNT(DISTINCT b.id)::bigint AS total_bets,
          COALESCE(SUM(v.amount), 0)::bigint AS total_coin_volume
        FROM bets b
        LEFT JOIN odd o ON o."betId" = b.id
        LEFT JOIN votes v ON v."oddId" = o.id
        WHERE b.created_at >= ${start}
          AND b.created_at <= ${end}
          ${categoryFilter}
      `),
      prisma.$queryRaw<{ active_users: bigint }[]>(Prisma.sql`
        SELECT COUNT(DISTINCT v.user_id)::bigint AS active_users
        FROM votes v
        INNER JOIN odd o ON o.id = v."oddId"
        INNER JOIN bets b ON b.id = o."betId"
        WHERE v.created_at >= ${start}
          AND v.created_at <= ${end}
          ${categoryFilter}
      `),
      prisma.$queryRaw<{ revenue_cents: bigint }[]>(Prisma.sql`
        SELECT COALESCE(SUM(revenue_cents), 0)::bigint AS revenue_cents
        FROM daily_pix_revenue
        WHERE day >= ${start}
          AND day <= ${end}
      `),
    ]);

    const totalBets = Number(betStats[0]?.total_bets ?? 0);
    const totalCoinVolume = Number(betStats[0]?.total_coin_volume ?? 0);
    const activeUsersCount = Number(activeUsers[0]?.active_users ?? 0);
    const revenueCents = Number(pixRevenue[0]?.revenue_cents ?? 0);

    return {
      activeUsers: activeUsersCount,
      totalBets,
      totalCoinVolume,
      pixRevenue: revenueCents / 100,
      averageBetsPerUser:
        activeUsersCount > 0 ? totalBets / activeUsersCount : 0,
    };
  }

  async getBetsByCategory(filter: AnalyticsFilter): Promise<BetsByCategoryRow[]> {
    const { start, end } = toDateRange(filter);
    const categoryFilter = filter.categoryId
      ? Prisma.sql`AND dbs.category_id = ${filter.categoryId}`
      : Prisma.empty;

    const rows = await prisma.$queryRaw<
      {
        category_id: number;
        category_name: string;
        bet_count: bigint;
        coin_volume: bigint;
      }[]
    >(Prisma.sql`
      SELECT
        dbs.category_id,
        c.title AS category_name,
        SUM(dbs.bet_count)::bigint AS bet_count,
        SUM(dbs.coin_volume)::bigint AS coin_volume
      FROM daily_bet_stats dbs
      INNER JOIN "Category" c ON c.id = dbs.category_id
      WHERE dbs.day >= ${start}
        AND dbs.day <= ${end}
        ${categoryFilter}
      GROUP BY dbs.category_id, c.title
      ORDER BY coin_volume DESC
    `);

    return rows.map((row) => ({
      categoryId: row.category_id,
      categoryName: row.category_name,
      betCount: Number(row.bet_count),
      coinVolume: Number(row.coin_volume),
    }));
  }

  async getPixRevenue(filter: AnalyticsFilter): Promise<PixRevenuePoint[]> {
    const { start, end } = toDateRange(filter);

    const rows = await prisma.$queryRaw<
      { day: Date; revenue_cents: bigint; payment_count: bigint }[]
    >(Prisma.sql`
      SELECT day, revenue_cents, payment_count
      FROM daily_pix_revenue
      WHERE day >= ${start}
        AND day <= ${end}
      ORDER BY day ASC
    `);

    return rows.map((row) => ({
      day: row.day.toISOString().slice(0, 10),
      revenueCents: Number(row.revenue_cents),
      paymentCount: Number(row.payment_count),
    }));
  }

  async getPeakHours(filter: AnalyticsFilter): Promise<PeakHourEntry[]> {
    const { start, end } = toDateRange(filter);
    const categoryFilter = filter.categoryId
      ? Prisma.sql`AND b."categoryId" = ${filter.categoryId}`
      : Prisma.empty;

    const rows = await prisma.$queryRaw<{ hour: number; bet_count: bigint }[]>(
      Prisma.sql`
        SELECT
          EXTRACT(HOUR FROM b.created_at)::int AS hour,
          COUNT(*)::bigint AS bet_count
        FROM bets b
        WHERE b.created_at >= ${start}
          AND b.created_at <= ${end}
          ${categoryFilter}
        GROUP BY EXTRACT(HOUR FROM b.created_at)
        ORDER BY hour ASC
      `,
    );

    const hourMap = new Map(
      rows.map((row) => [row.hour, Number(row.bet_count)]),
    );

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      betCount: hourMap.get(hour) ?? 0,
    }));
  }

  async *streamExportRows(filter: AnalyticsFilter) {
    const { start, end } = toDateRange(filter);
    const categoryFilter = filter.categoryId
      ? Prisma.sql`AND dbs.category_id = ${filter.categoryId}`
      : Prisma.empty;

    const rows = await prisma.$queryRaw<
      {
        day: Date;
        category_id: number;
        category_name: string;
        bet_count: bigint;
        coin_volume: bigint;
        revenue_cents: bigint | null;
        payment_count: bigint | null;
      }[]
    >(Prisma.sql`
      SELECT
        dbs.day,
        dbs.category_id,
        c.title AS category_name,
        dbs.bet_count,
        dbs.coin_volume,
        dpr.revenue_cents,
        dpr.payment_count
      FROM daily_bet_stats dbs
      INNER JOIN "Category" c ON c.id = dbs.category_id
      LEFT JOIN daily_pix_revenue dpr ON dpr.day = dbs.day
      WHERE dbs.day >= ${start}
        AND dbs.day <= ${end}
        ${categoryFilter}
      ORDER BY dbs.day ASC, dbs.category_id ASC
    `);

    for (const row of rows) {
      yield {
        day: row.day.toISOString().slice(0, 10),
        categoryId: row.category_id,
        categoryName: row.category_name,
        betCount: Number(row.bet_count),
        coinVolume: Number(row.coin_volume),
        revenueCents: row.revenue_cents ? Number(row.revenue_cents) : 0,
        paymentCount: row.payment_count ? Number(row.payment_count) : 0,
      };
    }
  }

  async refreshMaterializedViews(): Promise<void> {
    await prisma.$executeRawUnsafe(
      "REFRESH MATERIALIZED VIEW CONCURRENTLY daily_bet_stats",
    );
    await prisma.$executeRawUnsafe(
      "REFRESH MATERIALIZED VIEW CONCURRENTLY daily_pix_revenue",
    );
  }
}
