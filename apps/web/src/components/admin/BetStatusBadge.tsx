import React from "react";
import { BetStatus } from "../../types/bet";
import { cn } from "../../utils/cn";

const STATUS_STYLES: Record<BetStatus, string> = {
  open: "bg-sportsbook-odds/15 text-sportsbook-odds border-sportsbook-odds/30",
  closed: "bg-warning-400/15 text-warning-400 border-warning-400/30",
  resolved: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

const STATUS_LABELS: Record<BetStatus, string> = {
  open: "Aberta",
  closed: "Fechada",
  resolved: "Resolvida",
};

interface BetStatusBadgeProps {
  status: BetStatus;
}

const BetStatusBadge: React.FC<BetStatusBadgeProps> = ({ status }) => (
  <span
    className={cn(
      "inline-flex px-2 py-0.5 rounded text-xs font-display font-semibold uppercase tracking-wide border",
      STATUS_STYLES[status],
    )}
  >
    {STATUS_LABELS[status]}
  </span>
);

export default BetStatusBadge;
