import { useCallback, useMemo, useState } from "react";
import { Bet } from "../types/bet";
import { getDisplayBetStatus, isBetInResolutionQueue } from "../utils/betSchedule";

export function useBetResolutionQueue(bets: Bet[]) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [queue, setQueue] = useState<Bet[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const eligibleBets = useMemo(
    () => bets.filter((bet) => isBetInResolutionQueue(bet)),
    [bets],
  );

  const eligibleIds = useMemo(
    () => new Set(eligibleBets.map((bet) => bet.id)),
    [eligibleBets],
  );

  const currentBet = queue[queueIndex] ?? null;
  const isQueueActive = queue.length > 0 && queueIndex < queue.length;

  const toggleSelection = useCallback((betId: number) => {
    setSelectedIds((current) =>
      current.includes(betId)
        ? current.filter((id) => id !== betId)
        : [...current, betId],
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((current) => {
      const allSelected =
        eligibleBets.length > 0 &&
        eligibleBets.every((bet) => current.includes(bet.id));
      return allSelected ? [] : eligibleBets.map((bet) => bet.id);
    });
  }, [eligibleBets]);

  const startQueue = useCallback(
    (betIds: number[]) => {
      const ordered = bets.filter((bet) => betIds.includes(bet.id));
      if (ordered.length === 0) {
        return;
      }
      setQueue(ordered);
      setQueueIndex(0);
      setSuccessMessage(null);
    },
    [bets],
  );

  const startSelectedQueue = useCallback(() => {
    startQueue(selectedIds);
  }, [selectedIds, startQueue]);

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

  const allEligibleSelected =
    eligibleBets.length > 0 &&
    eligibleBets.every((bet) => selectedIds.includes(bet.id));

  return {
    eligibleBets,
    eligibleIds,
    selectedIds,
    selectedCount: selectedIds.length,
    allEligibleSelected,
    isSelected,
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
    clearSuccessMessage: () => setSuccessMessage(null),
    getDisplayBetStatus,
  };
}
