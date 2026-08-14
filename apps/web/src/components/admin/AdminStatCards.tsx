import React from "react";

export interface DashboardStats {
  totalBets: number;
  totalCategories: number;
  totalVotes: number;
  activeBets: number;
  houseTakeoutBalance: number;
  takeoutPercent: number;
}

const statCards = [
  {
    key: "totalBets" as const,
    label: "Total de Apostas",
    accent: "text-sportsbook-fg",
    glowClass: "bg-sportsbook-odds",
  },
  {
    key: "totalCategories" as const,
    label: "Categorias",
    accent: "text-sportsbook-odds",
    glowClass: "bg-sportsbook-odds",
  },
  {
    key: "totalVotes" as const,
    label: "Total de Votos",
    accent: "text-warning-400",
    glowClass: "bg-[var(--sb-brand-from)]",
  },
  {
    key: "activeBets" as const,
    label: "Apostas Ativas",
    accent: "text-orange-400",
    glowClass: "bg-[var(--sb-brand-to)]",
  },
  {
    key: "houseTakeoutBalance" as const,
    label: "Receita da casa",
    accent: "text-emerald-400",
    glowClass: "bg-sportsbook-odds",
    subtitleKey: "takeoutPercent" as const,
  },
];

interface AdminStatCardsProps {
  stats: DashboardStats;
}

const AdminStatCards: React.FC<AdminStatCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {statCards.map((card) => (
        <div
          key={card.key}
          className="sb-surface-raised border sb-border rounded-lg p-4 relative overflow-hidden"
        >
          <div
            className={`absolute top-0 right-0 w-16 h-16 opacity-5 rounded-full -translate-y-4 translate-x-4 ${card.glowClass}`}
            aria-hidden="true"
          />
          <p className="text-sportsbook-muted text-xs uppercase tracking-wider font-display">
            {card.label}
          </p>
          <p className={`text-3xl font-bold tabular-nums mt-1 ${card.accent}`}>
            {stats[card.key]}
          </p>
          {"subtitleKey" in card && card.subtitleKey && (
            <p className="text-[11px] text-sportsbook-muted mt-1">
              Takeout {stats[card.subtitleKey]}%
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminStatCards;
