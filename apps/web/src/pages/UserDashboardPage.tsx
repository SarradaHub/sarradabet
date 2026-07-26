import React, { useState } from "react";
import { Link } from "react-router-dom";
import type { CoinTransactionSource, VoteStatus } from "@sarradabet/types";
import Navigation from "../components/Navigation";
import { RankTierBadge } from "../components/gamification/RankTierBadge";
import { Button } from "../components/ui/Button";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useUserDashboard } from "../hooks/useUserDashboard";
import { calculateTier } from "../utils/ranking";

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SOURCE_LABELS: Record<CoinTransactionSource, string> = {
  PIX_PURCHASE: "Compra Pix",
  BET_COST: "Aposta",
  ADMIN_ADJUSTMENT: "Ajuste admin",
  REFUND: "Reembolso",
  WIN: "Prêmio",
  TAKEOUT: "Taxa da casa",
  REWARD_REDEMPTION: "Resgate de recompensa",
};

const VOTE_STATUS_LABELS: Record<VoteStatus, string> = {
  pending: "Pendente",
  paid: "Paga",
  lost: "Perdida",
};

function formatPayout(
  status: VoteStatus,
  amount: number,
  oddValue: number,
  payoutAmount: number | null,
): string {
  if (status !== "paid") {
    return "—";
  }

  const quotedReturn = Math.floor(amount * oddValue);
  const actualPayout = payoutAmount ?? 0;
  const displayAmount = Math.max(actualPayout, quotedReturn);

  return displayAmount.toLocaleString("pt-BR");
}

const UserDashboardPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { dashboard, loading, error, refetch } = useUserDashboard(page, limit);

  if (loading) {
    return (
      <div className="min-h-screen bg-sportsbook-bg text-white">
        <Navigation />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <LoadingSpinner text="Carregando dashboard..." />
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-sportsbook-bg text-white">
        <Navigation />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <ErrorMessage
            error={error ?? "Dashboard indisponível"}
            onRetry={() => void refetch()}
          />
        </div>
      </div>
    );
  }

  const tier = calculateTier(dashboard.ranking.score);
  const { pagination: betsPagination } = dashboard.recentBets;

  return (
    <div className="min-h-screen bg-sportsbook-bg text-white">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Meu Dashboard</h1>
            <p className="text-sportsbook-muted text-sm mt-1">
              Saldo, desempenho e histórico recente
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/leaderboard">
              <Button variant="secondary">Ranking</Button>
            </Link>
            <Link to="/coins">
              <Button variant="secondary">Moedas</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="sb-surface border sb-border rounded-2xl p-5">
            <p className="text-sportsbook-muted text-sm">Saldo</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">
              {dashboard.balance} moedas
            </p>
          </div>
          <div className="sb-surface border sb-border rounded-2xl p-5">
            <p className="text-sportsbook-muted text-sm">Ranking</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-bold">
                {dashboard.ranking.position ?? "—"}
              </p>
              <RankTierBadge tier={tier} />
            </div>
            <p className="text-xs text-sportsbook-muted mt-1">
              Pontuação {dashboard.ranking.score.toFixed(1)}
            </p>
          </div>
          <div className="sb-surface border sb-border rounded-2xl p-5">
            <p className="text-sportsbook-muted text-sm">Taxa de acerto</p>
            <p className="text-3xl font-bold mt-1">
              {formatPercent(dashboard.stats.winRate)}
            </p>
            <p className="text-xs text-sportsbook-muted mt-1">
              {dashboard.stats.wonBets}V / {dashboard.stats.lostBets}D ·{" "}
              {dashboard.stats.totalBets} apostas
            </p>
          </div>
        </div>

        <div className="sb-surface border sb-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b sb-border">
            <h2 className="font-display text-xl font-bold">Apostas recentes</h2>
          </div>
          {dashboard.recentBets.data.length === 0 ? (
            <p className="px-5 py-6 text-sm text-sportsbook-muted">
              Nenhuma aposta registrada ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sportsbook-raised text-sportsbook-muted">
                  <tr>
                    <th className="px-4 py-3 text-left">Aposta</th>
                    <th className="px-4 py-3 text-left">Odd</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3 text-right">Cota</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Prêmio</th>
                    <th className="px-4 py-3 text-right">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentBets.data.map((bet) => (
                    <tr key={bet.id} className="border-t sb-border">
                      <td className="px-4 py-3">{bet.betTitle}</td>
                      <td className="px-4 py-3">{bet.oddTitle}</td>
                      <td className="px-4 py-3 text-right">{bet.amount}</td>
                      <td className="px-4 py-3 text-right">
                        {bet.oddValue.toFixed(2)}x
                      </td>
                      <td className="px-4 py-3">
                        {VOTE_STATUS_LABELS[bet.status]}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-400">
                        {formatPayout(
                          bet.status,
                          bet.amount,
                          bet.oddValue,
                          bet.payoutAmount,
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatDate(bet.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {betsPagination.totalPages > 1 && (
            <div className="px-5 py-4 border-t sb-border flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Anterior
              </Button>
              <span className="text-xs text-sportsbook-muted">
                Página {betsPagination.page} de {betsPagination.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= betsPagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>

        <div className="sb-surface border sb-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b sb-border">
            <h2 className="font-display text-xl font-bold">
              Transações recentes
            </h2>
          </div>
          {dashboard.recentTransactions.data.length === 0 ? (
            <p className="px-5 py-6 text-sm text-sportsbook-muted">
              Nenhuma transação registrada ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sportsbook-raised text-sportsbook-muted">
                  <tr>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Origem</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3 text-right">Saldo</th>
                    <th className="px-4 py-3 text-right">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentTransactions.data.map((transaction) => (
                    <tr key={transaction.id} className="border-t sb-border">
                      <td className="px-4 py-3">{transaction.type}</td>
                      <td className="px-4 py-3">
                        {SOURCE_LABELS[transaction.source]}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {transaction.type === "DEBIT" ? "-" : "+"}
                        {transaction.displayAmount.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {transaction.balanceAfter}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatDate(transaction.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;
