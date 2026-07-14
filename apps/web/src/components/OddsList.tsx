import { useEffect, useRef, useState } from "react";
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

function OddCell({
  odd,
  votable,
  selected,
  pressed,
  onSelect,
}: {
  odd: OddWithVotes;
  votable: boolean;
  selected: boolean;
  pressed: boolean;
  onSelect: () => void;
}) {
  const prevRef = useRef({ value: odd.value, totalVotes: odd.totalVotes });
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    const prev = prevRef.current;
    if (
      prev.value !== odd.value ||
      prev.totalVotes !== odd.totalVotes
    ) {
      setChanged(true);
      const timer = setTimeout(() => setChanged(false), 600);
      prevRef.current = { value: odd.value, totalVotes: odd.totalVotes };
      return () => clearTimeout(timer);
    }
  }, [odd.value, odd.totalVotes]);

  const displayValue = formatOddValue(odd.value);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!votable}
      className={`sb-odds-cell ${selected ? "sb-odds-cell-selected" : ""} ${pressed ? "sb-odds-press" : ""} ${changed ? "sb-odds-changed" : ""} ${!votable ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`}
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
      {odds.map((odd) => (
        <OddCell
          key={odd.id}
          odd={odd}
          votable={votable}
          selected={isSelected(odd.id)}
          pressed={pressedId === odd.id}
          onSelect={() => handleSelectOdd(odd)}
        />
      ))}
    </div>
  );
};

export default OddsList;
