import { useState, useEffect, useCallback } from "react";
import { RealtimeEvents, type VoteCreatedPayload } from "@sarradabet/types";
import { format } from "date-fns";
import OddsList from "./OddsList";
import { useSocketEvent } from "../core/hooks/useSocket";
import { Bet } from "../types/bet";

interface BetCardProps {
  bet: Bet;
}

const BetCard = ({ bet }: BetCardProps) => {
  const [oddsData, setOddsData] = useState(bet.odds);
  const [totalVotes, setTotalVotes] = useState(bet.totalVotes ?? 0);

  const formattedDate = format(new Date(bet.createdAt), "dd/MM/yyyy");
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
        return updated ? { ...odd, totalVotes: updated.totalVotes } : odd;
      }),
    );
  });

  const handleOptimisticVote = useCallback((oddId: number) => {
    setOddsData((current) =>
      current.map((odd) =>
        odd.id === oddId
          ? { ...odd, totalVotes: odd.totalVotes + 1 }
          : odd,
      ),
    );
    setTotalVotes((current) => current + 1);
  }, []);

  const handleVoteRollback = useCallback(
    (_oddId: number, previousOdds: typeof bet.odds, previousTotal: number) => {
      setOddsData(previousOdds);
      setTotalVotes(previousTotal);
    },
    [],
  );

  return (
    <div className="group w-full min-w-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 sm:p-5 lg:p-6 border border-gray-700 hover:border-yellow-400/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-yellow-500/10 transform hover:-translate-y-1">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start mb-4">
        <h3 className="min-w-0 flex-1 text-base sm:text-lg font-bold text-white leading-tight line-clamp-2 group-hover:text-yellow-400 transition-colors">
          {bet.title}
        </h3>
        {categoryTitle && (
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-semibold shrink-0 self-start shadow-md max-w-full truncate">
            {categoryTitle}
          </span>
        )}
      </div>

      {bet.description && (
        <div className="mb-4">
          <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
            {bet.description}
          </p>
        </div>
      )}

      <div className="mb-6">
        <OddsList
          odds={oddsData}
          onOptimisticVote={handleOptimisticVote}
          onVoteRollback={handleVoteRollback}
        />
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-gray-700 sm:flex-row sm:flex-wrap sm:justify-between sm:items-center">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm min-w-0">
          <div className="flex items-center gap-2 text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span>{totalVotes} votos</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{formattedDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`w-2 h-2 rounded-full ${
              bet.status === "open"
                ? "bg-green-500"
                : bet.status === "resolved"
                  ? "bg-blue-500"
                  : "bg-gray-500"
            }`}
          ></div>
          <span
            className={`text-xs font-medium ${
              bet.status === "open"
                ? "text-green-400"
                : bet.status === "resolved"
                  ? "text-blue-400"
                  : "text-gray-400"
            }`}
          >
            {bet.status === "open"
              ? "Ativa"
              : bet.status === "resolved"
                ? "Resolvida"
                : "Inativa"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BetCard;
