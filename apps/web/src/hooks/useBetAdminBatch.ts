import { useCallback, useMemo, useState } from "react";
import { Bet } from "../types/bet";
import {
  getDisplayBetStatus,
  isBetClosable,
  isBetInResolutionQueue,
  isBetSelectableForAdminBatch,
} from "../utils/betSchedule";

export function useBetAdminBatch(bets: Bet[], visibleBets?: Bet[]) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [queue, setQueue] = useState<Bet[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const scopeBets = visibleBets ?? bets;

  const closableBets = useMemo(
    () => scopeBets.filter((bet) => isBetClosable(bet)),
    [scopeBets],
  );

  const resolvableBets = useMemo(
    () => scopeBets.filter((bet) => isBetInResolutionQueue(bet)),
    [scopeBets],
  );

  const selectableBets = useMemo(
    () => scopeBets.filter((bet) => isBetSelectableForAdminBatch(bet)),
    [scopeBets],
  );

  const closableIds = useMemo(
    () => new Set(closableBets.map((bet) => bet.id)),
    [closableBets],
  );

  const resolvableIds = useMemo(
    () => new Set(resolvableBets.map((bet) => bet.id)),
    [resolvableBets],
  );

  const selectableIds = useMemo(
    () => new Set(selectableBets.map((bet) => bet.id)),
    [selectableBets],
  );

  const selectedClosableIds = useMemo(
    () => selectedIds.filter((id) => closableIds.has(id)),
    [selectedIds, closableIds],
  );

  const selectedResolvableIds = useMemo(
    () => selectedIds.filter((id) => resolvableIds.has(id)),
    [selectedIds, resolvableIds],
  );

  const currentBet = queue[queueIndex] ?? null;
  const isQueueActive = queue.length > 0 && queueIndex < queue.length;

  const toggleSelection = useCallback(
    (betId: number) => {
      if (!selectableIds.has(betId)) {
        return;
      }

      setSelectionError(null);
      setSelectedIds((current) =>
        current.includes(betId)
          ? current.filter((id) => id !== betId)
          : [...current, betId],
      );
    },
    [selectableIds],
  );

  const toggleSelectAll = useCallback(() => {
    setSelectionError(null);
    setSelectedIds((current) => {
      const visibleSelectableIds = selectableBets.map((bet) => bet.id);
      const allVisibleSelected =
        visibleSelectableIds.length > 0 &&
        visibleSelectableIds.every((id) => current.includes(id));

      if (allVisibleSelected) {
        return current.filter((id) => !visibleSelectableIds.includes(id));
      }

      return [...new Set([...current, ...visibleSelectableIds])];
    });
  }, [selectableBets]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const startResolveQueue = useCallback(
    (betIds: number[]) => {
      const eligibleBetIds = betIds.filter((id) => resolvableIds.has(id));
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
    [bets, resolvableIds],
  );

  const startSelectedResolveQueue = useCallback(() => {
    startResolveQueue(selectedResolvableIds);
  }, [selectedResolvableIds, startResolveQueue]);

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
    (betId: number) => selectableIds.has(betId),
    [selectableIds],
  );

  const allSelectableSelected =
    selectableBets.length > 0 &&
    selectableBets.every((bet) => selectedIds.includes(bet.id));

  return {
    closableBets,
    resolvableBets,
    selectableBets,
    selectedClosableIds,
    selectedResolvableIds,
    selectedCloseCount: selectedClosableIds.length,
    selectedResolveCount: selectedResolvableIds.length,
    allSelectableSelected,
    isSelected,
    canSelect,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    startSelectedResolveQueue,
    startResolveQueue,
    currentBet,
    isQueueActive,
    queueTotal: queue.length,
    queuePosition: queueIndex + 1,
    advanceQueue,
    cancelQueue,
    successMessage,
    setSuccessMessage,
    selectionError,
    clearSuccessMessage: () => setSuccessMessage(null),
    clearSelectionError: () => setSelectionError(null),
    getDisplayBetStatus,
    isBetClosable,
    isBetInResolutionQueue,
  };
}
