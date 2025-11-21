import { Bet } from "../types/bet";
import { format } from "date-fns";
import OddsList from "./OddsList";
import { useState, useEffect, useCallback } from "react";
import { betService } from "../services/BetService";
import { categoryService } from "../services/CategoryService";

interface BetCardProps {
  bet: Bet;
  onVoteCreated?: () => void;
}

const BetCard = ({ bet, onVoteCreated }: BetCardProps) => {
  const [oddsData, setOddsData] = useState(bet.odds);
  const [categoryData, setCategoryData] = useState<{
    id: number;
    title: string;
  } | null>(null);

  const formattedDate = format(new Date(bet.createdAt), "dd/MM/yyyy");

  useEffect(() => {
    setOddsData(bet.odds);
  }, [bet.odds]);

  const fetchUpdatedOdds = async () => {
    try {
      const response = await betService.getById(bet.id);
      setOddsData(response.data.odds);
      onVoteCreated?.();
    } catch (error) {
      console.error("Error updating odds:", error);
    }
  };

  const fetchCategory = useCallback(async () => {
    if (typeof bet.categoryId !== "number") return;

    try {
      const category = await categoryService.getById(bet.categoryId);
      setCategoryData(category.data);
    } catch (error) {
      console.error("Error getting category:", error);
      setCategoryData(null);
    }
  }, [bet.categoryId]);

  useEffect(() => {
    if (bet.categoryId) {
      fetchCategory();
    }
  }, [bet.categoryId, fetchCategory]);

  return (
    <div className="group w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-yellow-400/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-yellow-500/10 transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-white pr-2 leading-tight group-hover:text-yellow-400 transition-colors">
          {bet.title}
        </h3>
        {categoryData && (
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-semibold shrink-0 shadow-md">
            {categoryData.title}
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
        <OddsList odds={oddsData} onVoteCreated={fetchUpdatedOdds} />
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-700">
        <div className="flex items-center gap-4 text-sm">
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
            <span>{bet.totalVotes ?? 0} votos</span>
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

        <div className="flex items-center gap-2">
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
