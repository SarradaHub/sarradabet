import type { BetWithOdds } from "../repositories/BetRepository";
import type { BetDetail, BetListItem } from "@sarradabet/types";

export function toBetListItem(bet: BetWithOdds): BetListItem {
  return {
    id: bet.id,
    title: bet.title,
    description: bet.description,
    status: bet.status,
    categoryId: bet.categoryId,
    category: bet.category,
    totalVotes: bet.totalVotes,
    createdAt: bet.createdAt,
    odds: bet.odds.map(({ id, title, value, totalVotes }) => ({
      id,
      title,
      value,
      totalVotes,
    })),
  };
}

export function toBetDetail(bet: BetWithOdds): BetDetail {
  return {
    ...toBetListItem(bet),
    updatedAt: bet.updatedAt,
    resolvedAt: bet.resolvedAt,
    odds: bet.odds.map(
      ({ id, title, value, totalVotes, result, betId }) => ({
        id,
        title,
        value,
        totalVotes,
        result,
        betId,
      }),
    ),
  };
}

export function toBetListItems(bets: BetWithOdds[]): BetListItem[] {
  return bets.map(toBetListItem);
}
