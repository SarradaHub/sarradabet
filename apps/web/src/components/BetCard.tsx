import { useState, useEffect } from "react";
import { RealtimeEvents, type VoteCreatedPayload } from "@sarradabet/types";
import { format } from "date-fns";
import OddsList from "./OddsList";
import { useSocketEvent } from "../core/hooks/useSocket";
import { mergeOddFromVoteUpdate } from "../utils/odds";
import { Bet } from "../types/bet";

interface BetCardProps {
  bet: Bet;
}

const BetCard = ({ bet }: BetCardProps) => {
  const [oddsData, setOddsData] = useState(bet.odds);
  const [totalVotes, setTotalVotes] = useState(bet.totalVotes ?? 0);

  const formattedDate = format(new Date(bet.createdAt), "dd/MM");
  const categoryTitle = bet.category?.title;

  useEffect(() => {
    setOddsData(bet.odds);
    setTotalVotes(bet.totalVotes ?? 0);
  }, [bet.odds, bet.totalVotes]);

  useSocketEvent<VoteCreatedPayload>(RealtimeEvents.VOTE_CREATED, (payload) => {
    if (payload.betId !== bet.id) return;

    setTotalVotes(payload.totalVotes);
    setOddsData((current) =>
      current.map((odd) => {
        const updated = payload.odds.find((o) => o.id === odd.id);
        return updated ? mergeOddFromVoteUpdate(odd, updated) : odd;
      }),
    );
  });

  const statusLabel =
    bet.status === "open"
      ? "Ativa"
      : bet.status === "resolved"
        ? "Resolvida"
        : "Inativa";

  const statusColor =
    bet.status === "open"
      ? "text-sportsbook-odds"
      : bet.status === "resolved"
        ? "text-blue-400"
        : "text-sportsbook-muted";

  return (
    <article className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-3 hover:bg-sportsbook-raised/50 transition-colors duration-150">
      <div className="min-w-0 flex-1 sm:max-w-[45%]">
        <div className="flex items-center gap-2 mb-0.5">
          {categoryTitle && (
            <span className="text-[10px] uppercase tracking-wider text-warning-400/90 font-display shrink-0">
              {categoryTitle}
            </span>
          )}
          <span className={`text-[10px] font-medium ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-warning-400 transition-colors">
          {bet.title}
        </h3>
        {bet.description && (
          <p className="text-xs text-sportsbook-muted line-clamp-1 mt-0.5">
            {bet.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1 text-[11px] text-sportsbook-muted tabular-nums">
          <span>{totalVotes} votos</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0 sm:flex sm:justify-end">
        <OddsList
          odds={oddsData}
          betId={bet.id}
          betTitle={bet.title}
          categoryTitle={categoryTitle}
          betStatus={bet.status}
        />
      </div>
    </article>
  );
};

export default BetCard;
