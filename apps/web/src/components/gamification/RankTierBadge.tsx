import type { RankTier } from "@sarradabet/types";
import { cn } from "../../utils/cn";

const TIER_STYLES: Record<RankTier, string> = {
  bronze: "bg-amber-900/40 text-amber-300 border-amber-700/50",
  silver: "bg-zinc-500/20 text-zinc-200 border-zinc-400/40",
  gold: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
};

const TIER_LABELS: Record<RankTier, string> = {
  bronze: "Bronze",
  silver: "Prata",
  gold: "Ouro",
};

interface RankTierBadgeProps {
  tier: RankTier;
  className?: string;
}

export function RankTierBadge({ tier, className }: RankTierBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        TIER_STYLES[tier],
        className,
      )}
    >
      {TIER_LABELS[tier]}
    </span>
  );
}
