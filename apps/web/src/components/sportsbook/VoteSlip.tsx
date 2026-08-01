import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { formatOddValue } from "../../utils/odds";
import { X } from "lucide-react";
import { useVoteSlip } from "../../context/VoteSlipContext";
import { useAuth } from "../../hooks/useAuth";
import { useCoinBalance } from "../../hooks/useCoinBalance";
import { Button } from "../ui/Button";
import { sportsbookFieldClass } from "../ui/SportsbookModal";
import BetReturnExplainer from "./BetReturnExplainer";
import { getApiErrorMessage } from "../../utils/apiError";
import { canAcceptWagers } from "../../utils/betSchedule";
import { submitVoteWithOptimism } from "../../utils/optimisticVote";
import { formatPartialVoteMessage } from "../../utils/voteSlipSubmit";

interface VoteSlipProps {
  variant?: "rail" | "sheet";
  onClose?: () => void;
}

const VoteSlip = ({ variant = "rail", onClose }: VoteSlipProps) => {
  const { selections, removeSelection, clearSelections, count } = useVoteSlip();
  const { isAuthenticated } = useAuth();
  const { balance, loading: balanceLoading, refetch, setBalance } =
    useCoinBalance();
  const location = useLocation();
  const [stakes, setStakes] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loginPath = `/login?redirect=${encodeURIComponent(
    `${location.pathname}${location.search}`,
  )}`;

  const getStake = (oddId: number) => {
    const value = stakes[oddId];
    if (value == null || value === "") {
      return 0;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  const handleStakeChange = (oddId: number, value: string) => {
    if (/^\d*$/.test(value)) {
      setStakes((current) => ({ ...current, [oddId]: value }));
    }
  };

  const votableSelections = useMemo(
    () =>
      selections.filter((selection) =>
        canAcceptWagers({
          status: selection.betStatus,
          startTime: selection.startTime,
          closesAt: selection.closesAt,
        }),
      ),
    [selections],
  );

  const blockedSelections = selections.length - votableSelections.length;

  const handleConfirm = async () => {
    if (submitting || count === 0) return;

    if (!isAuthenticated) {
      setError("Faça login para apostar com moedas.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      if (votableSelections.length === 0) {
        setError("Não é possível votar em apostas que ainda não abriram.");
        return;
      }

      const selectionsToSubmit = votableSelections.filter(
        (selection) => getStake(selection.oddId) > 0,
      );

      if (selectionsToSubmit.length === 0) {
        setError("Informe um valor de aposta válido para cada seleção.");
        return;
      }

      if (
        selectionsToSubmit.length !== votableSelections.length ||
        votableSelections.some((selection) => getStake(selection.oddId) <= 0)
      ) {
        setError("Informe um valor de aposta válido para cada seleção.");
        return;
      }

      const totalToSubmit = selectionsToSubmit.length;
      let succeededCount = 0;

      for (const selection of selectionsToSubmit) {
        const amount = getStake(selection.oddId);

        try {
          await submitVoteWithOptimism({
            oddId: selection.oddId,
            amount,
            betId: selection.betId,
            onBalanceAdjust: (delta) => {
              setBalance((current) => (current ?? 0) + delta);
            },
          });

          succeededCount += 1;
          removeSelection(selection.oddId);
          setStakes((current) => {
            const next = { ...current };
            delete next[selection.oddId];
            return next;
          });
        } catch (err) {
          await refetch();
          window.dispatchEvent(new CustomEvent("bet:staked"));

          const partialMessage = formatPartialVoteMessage(
            succeededCount,
            totalToSubmit,
          );
          const failureMessage = getApiErrorMessage(
            err,
            "Não foi possível registrar seus votos. Tente novamente.",
          );

          setError(
            partialMessage
              ? `${partialMessage} ${failureMessage}`
              : failureMessage,
          );
          return;
        }
      }

      clearSelections();
      setStakes({});
      setSuccess(true);
      window.dispatchEvent(new CustomEvent("bet:staked"));
      setTimeout(() => setSuccess(false), 3000);
      onClose?.();
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Não foi possível registrar seus votos. Tente novamente."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isSheet = variant === "sheet";
  const returnLines = useMemo(
    () =>
      selections
        .map((selection) => ({
          stake: getStake(selection.oddId),
          displayOdd: selection.oddValue,
        }))
        .filter((line) => line.stake > 0),
    [selections, stakes],
  );

  return (
    <div
      className={`flex flex-col h-full ${isSheet ? "max-h-[70vh]" : "min-h-0"}`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b sb-border shrink-0">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold tracking-wide text-white">
            Cupom de Votos
          </h2>
          <p className="text-xs text-sportsbook-muted">
            {count === 0
              ? "Selecione odds no painel"
              : `${count} seleção${count > 1 ? "ões" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-sportsbook-muted">
                Saldo
              </p>
              <p className="text-sm font-bold text-warning-400 tabular-nums">
                {balanceLoading ? "…" : `${balance ?? 0}`} moedas
              </p>
            </div>
          )}
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
            {selections.map((selection) => {
              const selectionOpen = canAcceptWagers({
                status: selection.betStatus,
                startTime: selection.startTime,
                closesAt: selection.closesAt,
              });

              return (
              <li
                key={selection.oddId}
                className={`sb-slip-enter sb-surface-raised border sb-border rounded-lg p-3 ${selectionOpen ? "" : "opacity-60"}`}
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
                    {!selectionOpen && (
                      <p className="text-[11px] text-warning-400 mt-1">
                        Mercado ainda não aberto para apostas
                      </p>
                    )}
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
                <div className="mt-2 flex items-end justify-between gap-3">
                  <label className="flex-1">
                    <span className="text-[10px] uppercase tracking-wide text-sportsbook-muted">
                      Stake (moedas)
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={stakes[selection.oddId] ?? ""}
                      onChange={(event) =>
                        handleStakeChange(selection.oddId, event.target.value)
                      }
                      placeholder="100"
                      className={`mt-1 w-full rounded px-2 py-1.5 text-sm tabular-nums ${sportsbookFieldClass}`}
                    />
                  </label>
                  <span className="text-sm font-bold text-sportsbook-odds tabular-nums">
                    {formatOddValue(selection.oddValue)}x
                  </span>
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 p-3 border-t sb-border space-y-2">
        {!isAuthenticated && count > 0 && (
          <p className="text-xs text-warning-400">
            <Link to={loginPath} className="underline hover:text-warning-300">
              Faça login
            </Link>{" "}
            para apostar com moedas.
          </p>
        )}

        {returnLines.length > 0 && <BetReturnExplainer lines={returnLines} />}

        {blockedSelections > 0 && (
          <p className="text-xs text-warning-400">
            {blockedSelections} seleção
            {blockedSelections > 1 ? "ões" : ""} aguardando abertura do mercado.
          </p>
        )}

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
          disabled={count === 0 || submitting || votableSelections.length === 0}
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
