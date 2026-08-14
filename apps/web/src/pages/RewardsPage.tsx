import React, { useState } from "react";
import { Link } from "react-router";
import type { Reward } from "@sarradabet/types";
import Navigation from "../components/Navigation";
import { AppFooter } from "../components/legal/AppFooter";
import { Button } from "../components/ui/Button";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { TicketRedemptionModal } from "../components/gamification/TicketRedemptionModal";
import { useAuth } from "../hooks/useAuth";
import { useCoinBalance } from "../hooks/useCoinBalance";
import { useRewards } from "../hooks/useRewards";
import { rewardService } from "../services/rewardService";
import { getApiErrorMessage } from "../utils/apiError";

const RewardsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { rewards, loading, error, refetch } = useRewards();
  const { balance, refetch: refetchBalance } = useCoinBalance();
  const [redeemingId, setRedeemingId] = useState<number | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [ticketImageUrl, setTicketImageUrl] = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<Reward | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const handleRedeem = async (reward: Reward) => {
    if (!isAuthenticated) {
      return;
    }

    setRedeemingId(reward.id);
    setRedeemError(null);
    setTicketCode(null);
    setTicketImageUrl(null);

    try {
      const result = await rewardService.redeem(reward.id);
      setTicketCode(result.ticketCode);
      setTicketImageUrl(result.ticketImageUrl);
      setLastReward(result.reward);
      setShowTicketModal(true);
      window.dispatchEvent(new CustomEvent("reward:redeemed"));
      await refetch();
      await refetchBalance();
    } catch (err) {
      setRedeemError(getApiErrorMessage(err));
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-sportsbook-bg text-sportsbook-fg flex flex-col">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 flex-1 w-full">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Recompensas</h1>
            <p className="text-sportsbook-muted text-sm mt-1">
              Troque suas moedas por prêmios exclusivos
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/leaderboard">
              <Button variant="secondary">Ranking</Button>
            </Link>
            {isAuthenticated ? (
              <Link to="/coins">
                <Button variant="secondary">Moedas</Button>
              </Link>
            ) : (
              <Link to="/login?redirect=/rewards">
                <Button variant="secondary">Entrar</Button>
              </Link>
            )}
          </div>
        </div>

        {!isAuthenticated && (
          <div className="sb-surface border sb-border rounded-xl px-4 py-3 text-sm text-sportsbook-muted">
            Catálogo público.{" "}
            <Link to="/login?redirect=/rewards" className="text-emerald-400 hover:underline">
              Entre na sua conta
            </Link>{" "}
            para resgatar recompensas.
          </div>
        )}

        {isAuthenticated && balance !== null && (
          <div className="sb-surface border sb-border rounded-xl px-4 py-3 text-sm">
            Saldo disponível:{" "}
            <span className="font-semibold text-emerald-400">
              {balance.toLocaleString("pt-BR")} moedas
            </span>
          </div>
        )}

        {redeemError && <ErrorMessage error={redeemError} />}
        {error && <ErrorMessage error={error} onRetry={() => void refetch()} />}

        {ticketCode && lastReward && (
          <TicketRedemptionModal
            isOpen={showTicketModal}
            onClose={() => setShowTicketModal(false)}
            ticketCode={ticketCode}
            reward={lastReward}
            ticketImageUrl={ticketImageUrl ?? undefined}
          />
        )}

        {loading ? (
          <LoadingSpinner text="Carregando recompensas..." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => (
              <article
                key={reward.id}
                className="sb-surface border sb-border rounded-2xl overflow-hidden flex flex-col"
              >
                {reward.imageUrl ? (
                  <img
                    src={reward.imageUrl}
                    alt={reward.title}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="h-40 bg-sportsbook-raised flex items-center justify-center text-sportsbook-muted">
                    Sem imagem
                  </div>
                )}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div>
                    <h2 className="font-display text-lg font-bold">
                      {reward.title}
                    </h2>
                    {reward.description && (
                      <p className="text-sm text-sportsbook-muted mt-1">
                        {reward.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <div className="text-sm">
                      <div className="font-semibold text-emerald-400">
                        {reward.coinCost.toLocaleString("pt-BR")} moedas
                      </div>
                      <div className="text-sportsbook-muted">
                        Estoque: {reward.stock}
                      </div>
                    </div>
                    {isAuthenticated ? (
                      <Button
                        size="sm"
                        disabled={redeemingId === reward.id}
                        onClick={() => void handleRedeem(reward)}
                      >
                        {redeemingId === reward.id ? "Resgatando..." : "Resgatar"}
                      </Button>
                    ) : (
                      <Link to="/login?redirect=/rewards">
                        <Button size="sm" variant="secondary">
                          Entrar para resgatar
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
            {rewards.length === 0 && (
              <p className="text-sportsbook-muted col-span-full text-center py-8">
                Nenhuma recompensa disponível no momento.
              </p>
            )}
          </div>
        )}
      </div>
      <AppFooter />
    </div>
  );
};

export default RewardsPage;
