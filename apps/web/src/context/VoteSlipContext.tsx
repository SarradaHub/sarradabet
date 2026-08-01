import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BetStatus } from "@sarradabet/types";
import { canAcceptWagers } from "../utils/betSchedule";

export interface SlipSelection {
  oddId: number;
  oddTitle: string;
  oddValue: number;
  betId: number;
  betTitle: string;
  categoryTitle?: string;
  betStatus: BetStatus;
  startTime?: string | Date | null;
  closesAt?: string | Date | null;
  totalStakeOnBet: number;
  stakeOnOdd: number;
}

interface VoteSlipContextValue {
  selections: SlipSelection[];
  addSelection: (selection: SlipSelection) => void;
  removeSelection: (oddId: number) => void;
  clearSelections: () => void;
  isSelected: (oddId: number) => boolean;
  count: number;
}

const VoteSlipContext = createContext<VoteSlipContextValue | null>(null);

export function VoteSlipProvider({ children }: { children: ReactNode }) {
  const [selections, setSelections] = useState<SlipSelection[]>([]);

  const addSelection = useCallback((selection: SlipSelection) => {
    if (
      !canAcceptWagers({
        status: selection.betStatus,
        startTime: selection.startTime,
        closesAt: selection.closesAt,
      })
    ) {
      return;
    }

    setSelections((current) => {
      const exists = current.some((item) => item.oddId === selection.oddId);
      if (exists) {
        return current.filter((item) => item.oddId !== selection.oddId);
      }
      return [...current, selection];
    });
  }, []);

  const removeSelection = useCallback((oddId: number) => {
    setSelections((current) => current.filter((item) => item.oddId !== oddId));
  }, []);

  const clearSelections = useCallback(() => {
    setSelections([]);
  }, []);

  const isSelected = useCallback(
    (oddId: number) => selections.some((item) => item.oddId === oddId),
    [selections],
  );

  const value = useMemo(
    () => ({
      selections,
      addSelection,
      removeSelection,
      clearSelections,
      isSelected,
      count: selections.length,
    }),
    [
      selections,
      addSelection,
      removeSelection,
      clearSelections,
      isSelected,
    ],
  );

  return (
    <VoteSlipContext.Provider value={value}>{children}</VoteSlipContext.Provider>
  );
}

export function useVoteSlip() {
  const context = useContext(VoteSlipContext);
  if (!context) {
    throw new Error("useVoteSlip must be used within VoteSlipProvider");
  }
  return context;
}
