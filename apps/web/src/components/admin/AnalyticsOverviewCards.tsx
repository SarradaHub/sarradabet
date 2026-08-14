import React from "react";
import type { AnalyticsOverview } from "@sarradabet/types";

const statCards = [
  { key: "activeUsers" as const, label: "Usuários ativos", accent: "text-sportsbook-fg" },
  { key: "totalBets" as const, label: "Apostas criadas", accent: "text-sportsbook-odds" },
  {
    key: "totalCoinVolume" as const,
    label: "Volume em moedas",
    accent: "text-warning-400",
  },
  {
    key: "pixRevenue" as const,
    label: "Receita Pix (R$)",
    accent: "text-emerald-400",
    format: (value: number) =>
      value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
  },
  {
    key: "averageBetsPerUser" as const,
    label: "Média apostas/usuário",
    accent: "text-orange-400",
    format: (value: number) => value.toFixed(1),
  },
];

interface AnalyticsOverviewCardsProps {
  overview: AnalyticsOverview;
}

const AnalyticsOverviewCards: React.FC<AnalyticsOverviewCardsProps> = ({
  overview,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {statCards.map((card) => {
        const rawValue = overview[card.key];
        const displayValue = card.format
          ? card.format(rawValue)
          : rawValue;

        return (
          <div
            key={card.key}
            className="sb-surface-raised border sb-border rounded-lg p-4"
          >
            <p className="text-sportsbook-muted text-xs uppercase tracking-wider font-display">
              {card.label}
            </p>
            <p className={`text-3xl font-bold tabular-nums mt-1 ${card.accent}`}>
              {displayValue}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default AnalyticsOverviewCards;
