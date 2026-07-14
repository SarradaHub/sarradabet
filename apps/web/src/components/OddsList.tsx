import { useState } from "react";
import type { BetStatus, OddWithVotes } from "@sarradabet/types";
import { formatOddValue } from "../utils/odds";
import { useVoteSlip } from "../context/VoteSlipContext";

interface OddsListProps {
  odds: OddWithVotes[];
  betId: number;
  betTitle: string;
  categoryTitle?: string;
  betStatus: BetStatus;
}

const OddsList = ({
  odds,
  betId,
  betTitle,
  categoryTitle,
  betStatus,
}: OddsListProps) => {
  const { addSelection, isSelected } = useVoteSlip();
  const [pressedId, setPressedId] = useState<number | null>(null);
  const votable = betStatus === "open";

  const handleSelectOdd = (odd: OddWithVotes) => {
    if (!votable) return;

    setPressedId(odd.id);
    setTimeout(() => setPressedId(null), 150);

    addSelection({
      oddId: odd.id,
      oddTitle: odd.title,
      oddValue: odd.value,
      betId,
      betTitle,
      categoryTitle,
      betStatus,
    });
  };

  return (
    <div className="flex flex-wrap gap-2 justify-start sm:justify-end w-full">
      {odds.map((odd) => {
        const selected = isSelected(odd.id);
        const pressed = pressedId === odd.id;

        const displayValue = formatOddValue(odd.value);

        return (
          <button
            key={odd.id}
            type="button"
            onClick={() => handleSelectOdd(odd)}
            disabled={!votable}
            className={`sb-odds-cell ${selected ? "sb-odds-cell-selected" : ""} ${pressed ? "sb-odds-press" : ""} ${!votable ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`}
            aria-pressed={selected}
            aria-disabled={!votable}
            aria-label={`${odd.title} ${displayValue}x`}
          >
            <span className="text-[10px] text-sportsbook-muted truncate max-w-[5rem] leading-tight">
              {odd.title}
            </span>
            <span className="text-sm font-bold text-sportsbook-odds tabular-nums leading-none mt-0.5">
              {displayValue}x
            </span>
            <span className="text-[9px] text-sportsbook-muted tabular-nums mt-0.5">
              {odd.totalVotes}v
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default OddsList;
