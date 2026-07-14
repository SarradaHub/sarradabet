import { useState } from "react";
import { formatOddValue } from "../../utils/odds";
import { X } from "lucide-react";
import { voteService } from "../../services/VoteService";
import { useVoteSlip } from "../../context/VoteSlipContext";
import { Button } from "../ui/Button";
import { queryCache } from "../../core/hooks/useQueryCache";

interface VoteSlipProps {
  variant?: "rail" | "sheet";
  onClose?: () => void;
}

const VoteSlip = ({ variant = "rail", onClose }: VoteSlipProps) => {
  const { selections, removeSelection, clearSelections, count } = useVoteSlip();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    if (submitting || count === 0) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const openSelections = selections.filter(
        (selection) => selection.betStatus === "open",
      );

      if (openSelections.length === 0) {
        setError("Não é possível votar em apostas inativas.");
        return;
      }

      for (const selection of openSelections) {
        await voteService.create({ oddId: selection.oddId });
      }
      queryCache.clearByPrefix("bets-");
      clearSelections();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onClose?.();
    } catch {
      setError("Não foi possível registrar seus votos. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const isSheet = variant === "sheet";

  return (
    <div
      className={`flex flex-col h-full ${isSheet ? "max-h-[70vh]" : "min-h-0"}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b sb-border shrink-0">
        <div>
          <h2 className="font-display text-lg font-bold tracking-wide text-white">
            Cupom de Votos
          </h2>
          <p className="text-xs text-sportsbook-muted">
            {count === 0
              ? "Selecione odds no painel"
              : `${count} seleção${count > 1 ? "ões" : ""}`}
          </p>
        </div>
        {isSheet && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-sportsbook-muted hover:text-white hover:bg-sportsbook-raised transition-colors"
            aria-label="Fechar cupom"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full sb-surface-raised border sb-border flex items-center justify-center mb-4">
              <svg
                className="w-7 h-7 text-sportsbook-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-sm text-sportsbook-muted max-w-[200px]">
              Clique em uma odd para adicionar ao cupom
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {selections.map((selection) => (
              <li
                key={selection.oddId}
                className="sb-slip-enter sb-surface-raised border sb-border rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {selection.categoryTitle && (
                      <p className="text-[10px] uppercase tracking-wider text-warning-400/80 font-display mb-0.5">
                        {selection.categoryTitle}
                      </p>
                    )}
                    <p className="text-xs text-sportsbook-muted truncate">
                      {selection.betTitle}
                    </p>
                    <p className="text-sm font-medium text-white truncate mt-0.5">
                      {selection.oddTitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSelection(selection.oddId)}
                    className="shrink-0 p-1 text-sportsbook-muted hover:text-red-400 transition-colors"
                    aria-label={`Remover ${selection.oddTitle}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 flex justify-end">
                  <span className="text-sm font-bold text-sportsbook-odds tabular-nums">
                    {formatOddValue(selection.oddValue)}x
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 p-3 border-t sb-border space-y-2">
        {error && (
          <p className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-xs text-sportsbook-odds" role="status">
            Votos registrados com sucesso!
          </p>
        )}
        {count > 0 && (
          <button
            type="button"
            onClick={clearSelections}
            className="w-full text-xs text-sportsbook-muted hover:text-white transition-colors py-1"
          >
            Limpar cupom
          </button>
        )}
        <Button
          onClick={handleConfirm}
          disabled={count === 0 || submitting}
          loading={submitting}
          className="w-full sb-brand-gradient text-black font-semibold font-display tracking-wide hover:from-warning-300 hover:to-orange-400 disabled:opacity-40"
        >
          {submitting ? "Registrando..." : "Confirmar votos"}
        </Button>
      </div>
    </div>
  );
};

export default VoteSlip;
