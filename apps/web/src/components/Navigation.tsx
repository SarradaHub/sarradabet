import { Link } from "react-router";
import { useState, type ReactNode } from "react";
import BrandLogo from "./BrandLogo";
import { Button } from "./ui/Button";
import ThemeToggle from "./ThemeToggle";
import { Settings } from "@sarradahub/design-system";
import { useAuth } from "../hooks/useAuth";

interface NavigationProps {
  mobileCategoryTrigger?: ReactNode;
}

const Navigation = ({ mobileCategoryTrigger }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const publicLinks = (
    <>
      <Link to="/leaderboard" onClick={closeMobileMenu}>
        <Button variant="secondary" size="sm" className="text-xs w-full md:w-auto">
          Ranking
        </Button>
      </Link>
      <Link to="/rewards" onClick={closeMobileMenu}>
        <Button variant="secondary" size="sm" className="text-xs w-full md:w-auto">
          Recompensas
        </Button>
      </Link>
    </>
  );

  const authButtons = (
    <>
      {publicLinks}
      {!isAuthenticated && (
        <>
          <Link to="/login" onClick={closeMobileMenu}>
            <Button variant="secondary" size="sm" className="text-xs w-full md:w-auto">
              Entrar
            </Button>
          </Link>
          <Link to="/register" onClick={closeMobileMenu}>
            <Button variant="secondary" size="sm" className="text-xs w-full md:w-auto">
              Cadastrar
            </Button>
          </Link>
        </>
      )}
      {isAuthenticated && (
        <>
          <Link to="/coins" onClick={closeMobileMenu}>
            <Button variant="secondary" size="sm" className="text-xs w-full md:w-auto">
              Moedas
            </Button>
          </Link>
          <Link to="/profile" onClick={closeMobileMenu}>
            <Button variant="secondary" size="sm" className="text-xs w-full md:w-auto">
              {user?.username ?? "Perfil"}
            </Button>
          </Link>
          <Link to="/dashboard" onClick={closeMobileMenu}>
            <Button variant="secondary" size="sm" className="text-xs w-full md:w-auto">
              Dashboard
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/admin/dashboard" onClick={closeMobileMenu}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={Settings}
                className="text-xs w-full md:w-auto"
              >
                Admin
              </Button>
            </Link>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="text-xs w-full md:w-auto"
            onClick={() => {
              closeMobileMenu();
              void logout();
            }}
          >
            Sair
          </Button>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 sb-surface border-b sb-border shrink-0">
      <div className="flex items-center justify-between h-12 px-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {mobileCategoryTrigger}
          <BrandLogo size="sm" linkToHome />
        </div>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {authButtons}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-1.5 text-zinc-400 hover:text-sportsbook-fg"
          aria-label="Menu"
          aria-expanded={isMobileMenuOpen}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t sb-border px-4 py-3 space-y-2">
          {authButtons}
        </div>
      )}
    </header>
  );
};

export default Navigation;
