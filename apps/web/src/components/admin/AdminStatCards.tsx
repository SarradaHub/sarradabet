import React from "react";

export interface DashboardStats {
  totalBets: number;
  totalCategories: number;
  totalVotes: number;
  activeBets: number;
}

const statCards = [
  { key: "totalBets" as const, label: "Total de Apostas", accent: "text-white" },
  {
    key: "totalCategories" as const,
    label: "Categorias",
    accent: "text-sportsbook-odds",
  },
  { key: "totalVotes" as const, label: "Total de Votos", accent: "text-warning-400" },
  { key: "activeBets" as const, label: "Apostas Ativas", accent: "text-orange-400" },
];

interface AdminStatCardsProps {
  stats: DashboardStats;
}

const AdminStatCards: React.FC<AdminStatCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => (
        <div
          key={card.key}
          className="sb-surface-raised border sb-border rounded-lg p-4 relative overflow-hidden"
        >
          <div
            className="absolute top-0 right-0 w-16 h-16 opacity-5 rounded-full -translate-y-4 translate-x-4"
            style={{
              background:
                card.key === "totalVotes"
                  ? "var(--sb-brand-from)"
                  : card.key === "activeBets"
                    ? "var(--sb-brand-to)"
                    : "var(--sb-odds)",
            }}
            aria-hidden="true"
          />
          <p className="text-sportsbook-muted text-xs uppercase tracking-wider font-display">
            {card.label}
          </p>
          <p className={`text-3xl font-bold tabular-nums mt-1 ${card.accent}`}>
            {stats[card.key]}
          </p>
        </div>
      ))}
    </div>
  );
};

export default AdminStatCards;
