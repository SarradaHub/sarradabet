import { Link } from "react-router";
import { Coins } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useCoinBalance } from "../../hooks/useCoinBalance";
import { cn } from "../../utils/cn";

interface UserSectionProps {
  variant?: "drawer" | "compact";
  onNavigate?: () => void;
  className?: string;
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

const UserSection = ({
  variant = "drawer",
  onNavigate,
  className,
}: UserSectionProps) => {
  const { user, isAuthenticated } = useAuth();
  const { balance, loading } = useCoinBalance();

  if (!isAuthenticated || !user) {
    return null;
  }

  const coinBalance = balance ?? user.coinBalance;
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        isCompact ? "flex items-center gap-3" : "px-4 py-4 border-b sb-border",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3",
          isCompact ? "min-w-0" : "w-full",
        )}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full sb-brand-gradient text-sm font-bold text-black"
          aria-hidden="true"
        >
          {getInitials(user.username)}
        </div>

        {!isCompact && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sportsbook-fg">
              {user.username}
            </p>
            <p className="truncate text-xs text-sportsbook-muted">{user.email}</p>
            <Link
              to="/profile"
              onClick={onNavigate}
              className="mt-1 inline-block text-xs text-warning-400 hover:underline"
            >
              Ver perfil
            </Link>
          </div>
        )}

        <Link
          to="/coins"
          onClick={onNavigate}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full sb-brand-gradient px-2.5 py-1 text-xs font-semibold text-black transition-transform hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100",
            isCompact && "shrink-0",
          )}
          aria-label={
            loading
              ? "Carregando saldo de moedas"
              : `${coinBalance} moedas disponíveis`
          }
        >
          <Coins className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{loading ? "…" : coinBalance}</span>
          {!isCompact && <span className="hidden sm:inline">moedas</span>}
        </Link>
      </div>
    </div>
  );
};

export default UserSection;
