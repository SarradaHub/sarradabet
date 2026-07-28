import { Link } from "react-router";
import { useState, type ReactNode } from "react";
import BrandLogo from "./BrandLogo";
import { Button } from "./ui/Button";
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
          <Link to="/coins" onClick={closeMobileMenu}>
            <Button variant="secondary" size="sm" className="text-xs w-full md:w-auto">
              Moedas
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
              void logout();
              closeMobileMenu();
            }}
          >
            Sair
          </Button>
        </>
      )}
    </>
  );

  return (
    <nav className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <BrandLogo />
            </Link>
            {mobileCategoryTrigger}
          </div>

          <div className="hidden md:flex items-center space-x-4">{authButtons}</div>

          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted hover:text-foreground hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col gap-2">
            {authButtons}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
