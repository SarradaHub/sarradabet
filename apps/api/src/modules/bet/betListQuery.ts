import { Prisma } from "@prisma/client";

export type BetListFilterInput = {
  status?: string;
  categoryId?: number;
  search?: string;
  excludeExpired?: boolean;
  queue?: "resolution";
};

const BET_STATUS_VALUES = ["scheduled", "open", "closed", "resolved"] as const;
type BetStatusValue = (typeof BET_STATUS_VALUES)[number];

function parseStatusList(status?: string): BetStatusValue[] | undefined {
  if (!status?.trim()) {
    return undefined;
  }

  const parts = status
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const unique = [...new Set(parts)] as BetStatusValue[];
  for (const value of unique) {
    if (!BET_STATUS_VALUES.includes(value)) {
      throw new Error(`Invalid status filter: ${value}`);
    }
  }

  return unique.length > 0 ? unique : undefined;
}

function applySearchFilter(
  where: Prisma.BetWhereInput,
  search?: string,
): void {
  if (!search?.trim()) {
    return;
  }

  const term = search.trim();
  where.OR = [
    { title: { contains: term, mode: "insensitive" } },
    { description: { contains: term, mode: "insensitive" } },
  ];
}

export function buildBetListWhere(
  query: BetListFilterInput,
  now = new Date(),
): Prisma.BetWhereInput {
  const where: Prisma.BetWhereInput = {};

  if (query.categoryId != null) {
    where.categoryId = query.categoryId;
  }

  applySearchFilter(where, query.search);

  if (query.queue === "resolution") {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { status: "closed" },
          {
            status: "open",
            closesAt: { lte: now },
          },
        ],
      },
    ];
    return where;
  }

  const statuses = parseStatusList(query.status);
  if (statuses?.length === 1) {
    where.status = statuses[0];
  } else if (statuses && statuses.length > 1) {
    where.status = { in: statuses };
  }

  if (query.excludeExpired) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { status: { not: "open" } },
          { closesAt: null },
          { closesAt: { gt: now } },
        ],
      },
    ];
  }

  return where;
}
