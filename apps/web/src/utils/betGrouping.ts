import { useMemo } from "react";
import { Bet } from "../types/bet";
import { Category } from "../types/category";
import { unwrapList } from "./apiData";
import { getDisplayBetStatus } from "./betSchedule";

export function unwrapBetsResponse(response: unknown): Bet[] {
  return unwrapList<Bet>(response);
}

export function groupBetsByCategory(
  bets: Bet[],
  categories: Category[],
): Array<{
  id: number | "uncategorized";
  name: string;
  bets: Bet[];
}> {
  if (!bets.length) {
    return [];
  }

  const groups = new Map<
    number | "uncategorized",
    {
      category?: Category;
      bets: Bet[];
    }
  >();

  groups.set("uncategorized", { bets: [] });

  categories.forEach((category) => {
    groups.set(category.id, { category, bets: [] });
  });

  bets.forEach((bet) => {
    if (bet.categoryId && groups.has(bet.categoryId)) {
      groups.get(bet.categoryId)!.bets.push(bet);
    } else {
      groups.get("uncategorized")!.bets.push(bet);
    }
  });

  return Array.from(groups.entries())
    .filter(([, group]) => group.bets.length > 0)
    .map(([id, group]) => ({
      id,
      name: group.category?.title || "Sem Categoria",
      bets: group.bets,
    }));
}

export function buildCategoryCounts(
  bets: Bet[],
  categories: Category[],
  groupedBets: ReturnType<typeof groupBetsByCategory>,
): Map<number | "all" | "uncategorized", number> {
  const counts = new Map<number | "all" | "uncategorized", number>();
  counts.set("all", bets.length);
  groupedBets.forEach((group) => {
    if (group.id === "uncategorized") {
      counts.set("uncategorized", group.bets.length);
    } else {
      counts.set(group.id as number, group.bets.length);
    }
  });
  categories.forEach((category) => {
    if (!counts.has(category.id)) {
      counts.set(category.id, 0);
    }
  });
  return counts;
}

export function filterBetsByDisplayStatus(
  bets: Bet[],
  statusFilter: "all" | "open" | "scheduled" | "closed" | "resolved",
): Bet[] {
  if (statusFilter === "all") {
    return bets;
  }

  return bets.filter((bet) => getDisplayBetStatus(bet) === statusFilter);
}

export function useGroupedBets(bets: Bet[], categories: Category[]) {
  return useMemo(() => groupBetsByCategory(bets, categories), [bets, categories]);
}
