import React from "react";
import { Link } from "react-router";
import Navigation from "../components/Navigation";
import { RankTierBadge } from "../components/gamification/RankTierBadge";
import { StatsCard } from "../components/gamification/StatsCard";
import { Button } from "../components/ui/Button";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { useUserStats } from "../hooks/useUserStats";
import { cn } from "../utils/cn";

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

const LeaderboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { entries, loading, error, refetch } = useLeaderboard();
  const {
    stats,
    loading: statsLoading,
    error: statsError,
  } = useUserStats();

  return (
    <div className="min-h-screen bg-sportsbook-bg text-white">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Ranking</h1>
            <p className="text-sportsbook-muted text-sm mt-1">
              Top 100 jogadores por pontuação
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/rewards">
              <Button variant="secondary">Recompensas</Button>
            </Link>
            <Link to="/">
              <Button variant="secondary">Início</Button>
            </Link>
          </div>
        </div>

        {isAuthenticated && stats && !statsLoading && (
          <StatsCard stats={stats} />
        )}
        {!isAuthenticated && (
          <div className="sb-surface border sb-border rounded-xl px-4 py-3 text-sm text-sportsbook-muted">
            Ranking público.{" "}
            <Link to="/login?redirect=/leaderboard" className="text-emerald-400 hover:underline">
              Entre na sua conta
            </Link>{" "}
            para ver suas estatísticas.
          </div>
        )}
        {isAuthenticated && statsError && <ErrorMessage error={statsError} />}

        {error && <ErrorMessage error={error} onRetry={() => void refetch()} />}

        {loading ? (
          <LoadingSpinner text="Carregando ranking..." />
        ) : (
          <div className="sb-surface border sb-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-sportsbook-raised text-sportsbook-muted">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Jogador</th>
                  <th className="px-4 py-3 text-left">Tier</th>
                  <th className="px-4 py-3 text-right">Pontuação</th>
                  <th className="px-4 py-3 text-right">Acerto</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.userId}
                    className={cn(
                      "border-t sb-border",
                      user?.id === entry.userId && "bg-emerald-500/10",
                    )}
                  >
                    <td className="px-4 py-3 font-semibold">{entry.rank}</td>
                    <td className="px-4 py-3">{entry.username}</td>
                    <td className="px-4 py-3">
                      <RankTierBadge tier={entry.tier} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {entry.rankingScore.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatPercent(entry.winRate)}
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sportsbook-muted"
                    >
                      Nenhum jogador no ranking ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
