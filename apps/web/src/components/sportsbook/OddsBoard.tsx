import { Bet } from "../../types/bet";
import BetCard from "../BetCard";
import BetRowSkeleton from "../ui/BetRowSkeleton";

interface OddsBoardProps {
  groupedBets: Array<{
    id: number | "uncategorized";
    name: string;
    bets: Bet[];
  }>;
  loading?: boolean;
}

const OddsBoard = ({ groupedBets, loading }: OddsBoardProps) => {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <BetRowSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (groupedBets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <p className="font-display text-2xl font-bold text-white mb-2">
          Nenhum mercado encontrado
        </p>
        <p className="text-sportsbook-muted text-sm max-w-sm">
          Nenhum mercado disponível no momento. Volte em breve para novas apostas.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-sportsbook-border">
      {groupedBets.map((group) => (
        <section key={group.id} className="sb-surface">
          <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-2.5 sb-surface-raised border-b sb-border">
            <div className="w-1 h-5 sb-brand-gradient rounded-full shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-bold tracking-wide text-white truncate uppercase">
                {group.name}
              </h2>
              <p className="text-[11px] text-sportsbook-muted">
                {group.bets.length} mercado{group.bets.length !== 1 ? "s" : ""}
              </p>
            </div>
          </header>

          <div className="divide-y divide-sportsbook-border/60">
            {group.bets.map((bet) => (
              <BetCard key={bet.id} bet={bet} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default OddsBoard;
