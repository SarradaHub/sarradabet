import type { UserStats } from "@sarradabet/types";
import { RankTierBadge } from "./RankTierBadge";

interface StatsCardProps {
  stats: UserStats;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function StatsCard({ stats }: StatsCardProps) {
  return (
    <div className="sb-surface border sb-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">Suas estatísticas</h2>
        <RankTierBadge tier={stats.tier} />
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-sportsbook-muted">Pontuação</dt>
          <dd className="text-lg font-semibold">
            {stats.rankingScore.toFixed(1)}
          </dd>
        </div>
        <div>
          <dt className="text-sportsbook-muted">Taxa de acerto</dt>
          <dd className="text-lg font-semibold">{formatPercent(stats.winRate)}</dd>
        </div>
        <div>
          <dt className="text-sportsbook-muted">Total de apostas</dt>
          <dd className="text-lg font-semibold">{stats.totalBets}</dd>
        </div>
        <div>
          <dt className="text-sportsbook-muted">Vitórias</dt>
          <dd className="text-lg font-semibold text-emerald-400">
            {stats.wonBets}
          </dd>
        </div>
        <div>
          <dt className="text-sportsbook-muted">Derrotas</dt>
          <dd className="text-lg font-semibold text-red-400">{stats.lostBets}</dd>
        </div>
      </dl>
    </div>
  );
}
