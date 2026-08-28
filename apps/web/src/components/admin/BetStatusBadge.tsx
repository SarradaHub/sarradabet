import React from "react";
import { BetStatus } from "../../types/bet";
import { cn } from "../../utils/cn";
import { getDisplayBetStatus } from "../../utils/betSchedule";

const STATUS_STYLES: Record<BetStatus, string> = {
  scheduled: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  open: "bg-sportsbook-odds/15 text-sportsbook-odds border-sportsbook-odds/30",
  closed: "bg-warning-400/15 text-warning-400 border-warning-400/30",
  resolved: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

const STATUS_LABELS: Record<BetStatus, string> = {
  scheduled: "Agendada",
  open: "Aberta",
  closed: "Fechada",
  resolved: "Resolvida",
};

type BetStatusBadgeProps = {
  status?: BetStatus;
  bet?: {
    status: BetStatus;
    startTime?: string | Date | null;
    closesAt?: string | Date | null;
  };
};

const BetStatusBadge: React.FC<BetStatusBadgeProps> = ({ status, bet }) => {
  const displayStatus = bet ? getDisplayBetStatus(bet) : status ?? "open";

  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded text-xs font-display font-semibold uppercase tracking-wide border",
        STATUS_STYLES[displayStatus],
      )}
    >
      {STATUS_LABELS[displayStatus]}
    </span>
  );
};

export default BetStatusBadge;
