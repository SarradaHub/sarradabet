import { useState } from "react";
import { Odd } from "../types/odd";
import { voteService } from "../services/VoteService";

interface OddsListProps {
  odds: Odd[];
  onOptimisticVote?: (oddId: number) => void;
  onVoteRollback?: (
    oddId: number,
    previousOdds: Odd[],
    previousTotal: number,
  ) => void;
}

const OddsList = ({
  odds,
  onOptimisticVote,
  onVoteRollback,
}: OddsListProps) => {
  const [votingOddId, setVotingOddId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateVote = async (oddId: number) => {
    if (votingOddId !== null) return;

    const previousOdds = odds.map((odd) => ({ ...odd }));
    const previousTotal = odds.reduce((sum, odd) => sum + odd.totalVotes, 0);

    setError(null);
    setVotingOddId(oddId);
    onOptimisticVote?.(oddId);

    try {
      await voteService.create({ oddId });
    } catch (voteError) {
      console.error("Erro ao criar voto:", voteError);
      onVoteRollback?.(oddId, previousOdds, previousTotal);
      setError("Não foi possível registrar seu voto. Tente novamente.");
    } finally {
      setVotingOddId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-4 h-4 text-yellow-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        <span className="text-sm font-semibold text-gray-300">
          Opções de Aposta
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-400 mb-3" role="alert">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3">
        {odds.map((odd) => (
          <button
            key={odd.id}
            onClick={() => handleCreateVote(odd.id)}
            disabled={votingOddId !== null}
            className="group w-full min-w-0 overflow-hidden flex flex-col gap-2 bg-gradient-to-r from-gray-700 to-gray-800 p-3 sm:p-4 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 border border-gray-600 hover:border-yellow-400/50 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="min-w-0 w-full text-left">
              <span className="block truncate text-white font-medium group-hover:text-yellow-400 transition-colors">
                {odd.title}
              </span>
            </div>
            <div className="flex items-center justify-end gap-2 shrink-0 w-full">
              <span className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold text-center">
                {odd.totalVotes}
              </span>
              <span className="bg-gradient-to-r from-green-600 to-green-500 text-white px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold text-center shadow-md">
                {odd.value}x
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default OddsList;
