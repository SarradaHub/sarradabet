import { buildBetListWhere } from "../betListQuery";

describe("buildBetListWhere", () => {
  const now = new Date("2026-08-27T12:00:00.000Z");

  it("filters by single status", () => {
    const where = buildBetListWhere({ status: "open" }, now);
    expect(where).toEqual({ status: "open" });
  });

  it("filters by comma-separated statuses", () => {
    const where = buildBetListWhere({ status: "open,scheduled" }, now);
    expect(where).toEqual({ status: { in: ["open", "scheduled"] } });
  });

  it("excludes expired open bets when excludeExpired is true", () => {
    const where = buildBetListWhere(
      {
        status: "open,scheduled",
        excludeExpired: true,
      },
      now,
    );

    expect(where.status).toEqual({ in: ["open", "scheduled"] });
    expect(where.AND).toEqual([
      {
        OR: [
          { status: { not: "open" } },
          { closesAt: null },
          { closesAt: { gt: now } },
        ],
      },
    ]);
  });

  it("builds resolution queue filter", () => {
    const where = buildBetListWhere({ queue: "resolution" }, now);

    expect(where.AND).toEqual([
      {
        OR: [
          { status: "closed" },
          {
            status: "open",
            closesAt: { lte: now },
          },
        ],
      },
    ]);
  });

  it("applies category and search filters", () => {
    const where = buildBetListWhere(
      {
        categoryId: 3,
        search: "futebol",
      },
      now,
    );

    expect(where.categoryId).toBe(3);
    expect(where.OR).toEqual([
      { title: { contains: "futebol", mode: "insensitive" } },
      { description: { contains: "futebol", mode: "insensitive" } },
    ]);
  });
});
