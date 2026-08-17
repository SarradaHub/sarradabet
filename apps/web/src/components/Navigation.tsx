import { type ReactNode } from "react";
import BrandLogo from "./BrandLogo";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../hooks/useAuth";
import { useMenuToggle } from "../hooks/useMenuToggle";
import {
  DesktopNav,
  HamburgerButton,
  MobileDrawer,
  Breadcrumb,
} from "./navigation";

interface NavigationProps {
  mobileCategoryTrigger?: ReactNode;
}

const Navigation = ({ mobileCategoryTrigger }: NavigationProps) => {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const { isOpen, toggle, close, prefersReducedMotion } = useMenuToggle();

  const handleLogout = () => {
    void logout();
  };

  return (
    <>
      <header
        className={`sticky top-0 sb-surface border-b sb-border shrink-0 ${
          isOpen ? "z-[70]" : "z-50"
        }`}
      >
        <div className="flex items-center justify-between h-12 px-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {mobileCategoryTrigger}
            <BrandLogo size="sm" linkToHome />
          </div>

          <DesktopNav
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            onLogout={handleLogout}
          />

          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle />
            <HamburgerButton isOpen={isOpen} onToggle={toggle} />
          </div>
        </div>

        <MobileDrawer
          isOpen={isOpen}
          onClose={close}
          prefersReducedMotion={prefersReducedMotion}
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          onLogout={handleLogout}
        />
      </header>
      <Breadcrumb />
    </>
  );
};

export default Navigation;
