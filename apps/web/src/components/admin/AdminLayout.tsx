import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Ticket, FolderOpen, Coins, Users } from "lucide-react";
import BrandLogo from "../BrandLogo";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { cn } from "../../utils/cn";

const navItems = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/bets", label: "Apostas", icon: Ticket },
  { to: "/admin/categories", label: "Categorias", icon: FolderOpen },
  { to: "/admin/coin-packages", label: "Pacotes", icon: Coins },
  { to: "/admin/users", label: "Usuários", icon: Users },
];

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { adminInfo, loading, error, handleLogout } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-sportsbook-bg flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-sportsbook-bg flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <ErrorMessage
            error={error}
            title="Erro no Dashboard"
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sportsbook-bg relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--sb-brand-from) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-48 -left-24 w-80 h-80 rounded-full opacity-10 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--sb-odds) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <header className="sb-surface border-b sb-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandLogo size="sm" showText={false} />
              <div>
                <h1 className="font-display text-xl font-bold text-white tracking-wide">
                  Admin Dashboard
                </h1>
                <p className="text-sportsbook-muted text-xs">
                  {adminInfo?.username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate("/")}
                className="text-xs"
              >
                Ver Site
              </Button>
              <Button variant="danger" size="sm" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav
          className="flex gap-1 overflow-x-auto pb-4 lg:hidden"
          aria-label="Admin navigation"
        >
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-semibold tracking-wide whitespace-nowrap transition-colors",
                  isActive
                    ? "sb-brand-gradient text-black"
                    : "sb-surface-raised border sb-border text-sportsbook-muted hover:text-white",
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex gap-6">
          <aside className="hidden lg:block w-52 shrink-0">
            <nav className="space-y-1 sticky top-20" aria-label="Admin navigation">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-display font-semibold tracking-wide transition-colors",
                      isActive
                        ? "sb-brand-gradient text-black"
                        : "text-sportsbook-muted hover:text-white hover:bg-sportsbook-raised",
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0 pb-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
