import { useCallback, useMemo, useState } from "react";
import { Bet } from "../types/bet";
import { getDisplayBetStatus, isBetInResolutionQueue } from "../utils/betSchedule";

export function useBetResolutionQueue(bets: Bet[], visibleBets?: Bet[]) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [queue, setQueue] = useState<Bet[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const scopeBets = visibleBets ?? bets;

  const eligibleBets = useMemo(
    () => scopeBets.filter((bet) => isBetInResolutionQueue(bet)),
    [scopeBets],
  );

  const eligibleIds = useMemo(
    () => new Set(eligibleBets.map((bet) => bet.id)),
    [eligibleBets],
  );

  const selectedEligibleIds = useMemo(
    () => selectedIds.filter((id) => eligibleIds.has(id)),
    [selectedIds, eligibleIds],
  );

  const currentBet = queue[queueIndex] ?? null;
  const isQueueActive = queue.length > 0 && queueIndex < queue.length;

  const toggleSelection = useCallback(
    (betId: number) => {
      if (!eligibleIds.has(betId)) {
        return;
      }

      setSelectionError(null);
      setSelectedIds((current) =>
        current.includes(betId)
          ? current.filter((id) => id !== betId)
          : [...current, betId],
      );
    },
    [eligibleIds],
  );

  const toggleSelectAll = useCallback(() => {
    setSelectionError(null);
    setSelectedIds((current) => {
      const visibleEligibleIds = eligibleBets.map((bet) => bet.id);
      const allVisibleSelected =
        visibleEligibleIds.length > 0 &&
        visibleEligibleIds.every((id) => current.includes(id));

      if (allVisibleSelected) {
        return current.filter((id) => !visibleEligibleIds.includes(id));
      }

      const merged = new Set([...current, ...visibleEligibleIds]);
      return [...merged];
    });
  }, [eligibleBets]);

  const startQueue = useCallback(
    (betIds: number[]) => {
      const eligibleBetIds = betIds.filter((id) => eligibleIds.has(id));
      const ordered = bets.filter((bet) => eligibleBetIds.includes(bet.id));

      if (ordered.length === 0) {
        setSelectionError(
          "Selecione apostas fechadas (ou abertas expiradas) para resolver.",
        );
        return;
      }

      setSelectionError(null);
      setQueue(ordered);
      setQueueIndex(0);
      setSuccessMessage(null);
    },
    [bets, eligibleIds],
  );

  const startSelectedQueue = useCallback(() => {
    startQueue(selectedEligibleIds);
  }, [selectedEligibleIds, startQueue]);

  const advanceQueue = useCallback(() => {
    setQueueIndex((current) => {
      const nextIndex = current + 1;
      if (nextIndex >= queue.length) {
        setSuccessMessage(`Apostas resolvidas com sucesso (${queue.length}).`);
        setQueue([]);
        setSelectedIds([]);
        return 0;
      }

      setSuccessMessage(`Aposta resolvida (${nextIndex}/${queue.length}).`);
      return nextIndex;
    });
  }, [queue.length]);

  const cancelQueue = useCallback(() => {
    setQueue([]);
    setQueueIndex(0);
  }, []);

  const isSelected = useCallback(
    (betId: number) => selectedIds.includes(betId),
    [selectedIds],
  );

  const canSelect = useCallback(
    (betId: number) => eligibleIds.has(betId),
    [eligibleIds],
  );

  const allEligibleSelected =
    eligibleBets.length > 0 &&
    eligibleBets.every((bet) => selectedIds.includes(bet.id));

  return {
    eligibleBets,
    eligibleIds,
    selectedIds: selectedEligibleIds,
    selectedCount: selectedEligibleIds.length,
    allEligibleSelected,
    isSelected,
    canSelect,
    toggleSelection,
    toggleSelectAll,
    startSelectedQueue,
    startQueue,
    currentBet,
    isQueueActive,
    queueTotal: queue.length,
    queuePosition: queueIndex + 1,
    advanceQueue,
    cancelQueue,
    successMessage,
    selectionError,
    clearSuccessMessage: () => setSuccessMessage(null),
    clearSelectionError: () => setSelectionError(null),
    getDisplayBetStatus,
  };
}
