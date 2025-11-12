import { randomUUID } from "crypto";
import { BetWithOdds } from "../../modules/bet/repositories/BetRepository";

type BetWithOptionalMatch = BetWithOdds & { matchId?: number | null };

export const betMarketCreatedPayload = (bet: BetWithOptionalMatch) => ({
  eventId: randomUUID(),
  schemaVersion: "v1",
  occurredAt: new Date().toISOString(),
  source: "sarradabet",
  payload: {
    betId: bet.id.toString(),
    matchId:
      "matchId" in bet && bet.matchId ? bet.matchId.toString() : undefined,
    status: bet.status,
    marketType: "moneyline",
    title: bet.title,
    description: bet.description ?? undefined,
    odds: bet.odds.map((odd) => ({
      oddId: odd.id.toString(),
      outcome: odd.title,
      value: odd.value,
    })),
    limits: {
      minStake: 1,
      maxStake: 1000,
    },
    createdAt: bet.createdAt.toISOString(),
  },
});

export const wagerAcceptedPayload = (params: {
  wagerId: string;
  betId: string;
  oddId: string;
  userId?: string;
  stake: number;
  potentialPayout?: number;
}) => ({
  eventId: randomUUID(),
  schemaVersion: "v1",
  occurredAt: new Date().toISOString(),
  source: "sarradabet",
  payload: {
    wagerId: params.wagerId,
    betId: params.betId,
    oddId: params.oddId,
    userId: params.userId ?? "00000000-0000-0000-0000-000000000000",
    stake: params.stake,
    potentialPayout: params.potentialPayout ?? params.stake * 2,
    currency: "BRL",
    acceptedAt: new Date().toISOString(),
    channel: "web",
  },
});
