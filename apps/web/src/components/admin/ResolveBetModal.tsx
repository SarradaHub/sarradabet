import React, { useState, useEffect } from "react";
import { useResolveBet, invalidateBetsQueries } from "../../hooks";
import { Bet } from "../../types/bet";
import SportsbookModal from "../ui/SportsbookModal";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { unwrapBet } from "../../utils/apiData";
import { cn } from "../../utils/cn";

interface ResolveBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  bet: Bet | null;
  onBetResolved: (bet: Bet) => void;
}

const ResolveBetModal: React.FC<ResolveBetModalProps> = ({
  isOpen,
  onClose,
  bet,
  onBetResolved,
}) => {
  const [winningOddId, setWinningOddId] = useState<number | null>(null);
  const resolveBetMutation = useResolveBet();

  useEffect(() => {
    if (isOpen && bet) {
      setWinningOddId(null);
      resolveBetMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, bet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bet || !winningOddId) return;

    try {
      const result = await resolveBetMutation.mutateAsync({
        id: bet.id,
        winningOddId,
      });

      const resolved = unwrapBet(result);
      if (resolved) {
        invalidateBetsQueries();
        onBetResolved(resolved);
        onClose();
      }
    } catch (error) {
      console.error("Failed to resolve bet:", error);
    }
  };

  if (!bet) return null;

  return (
    <SportsbookModal
      isOpen={isOpen}
      onClose={onClose}
      title="Resolver aposta"
      description={`Selecione a opção vencedora para "${bet.title}"`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          {bet.odds.map((odd) => (
            <button
              key={odd.id}
              type="button"
              onClick={() => setWinningOddId(odd.id)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg border transition-colors",
                winningOddId === odd.id
                  ? "border-warning-400 bg-warning-400/10 text-white"
                  : "sb-border sb-surface text-sportsbook-muted hover:text-white hover:border-sportsbook-muted",
              )}
            >
              <span className="font-medium">{odd.title}</span>
              <span className="text-xs text-sportsbook-muted ml-2">
                {odd.totalVotes} votos · {odd.value.toFixed(2)}x
              </span>
            </button>
          ))}
        </div>

        {resolveBetMutation.error && (
          <ErrorMessage
            error={resolveBetMutation.error}
            title="Falha ao resolver aposta"
          />
        )}

        <div className="flex justify-end gap-3 pt-2 border-t sb-border">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={resolveBetMutation.loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={resolveBetMutation.loading}
            disabled={resolveBetMutation.loading || !winningOddId}
            className="sb-brand-gradient text-black font-display font-semibold"
          >
            Resolver
          </Button>
        </div>
      </form>
    </SportsbookModal>
  );
};

export default ResolveBetModal;
