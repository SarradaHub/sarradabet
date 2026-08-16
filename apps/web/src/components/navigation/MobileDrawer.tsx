import { useEffect, useRef } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { useLocation } from "react-router";
import NavLinks from "./NavLinks";
import UserSection from "./UserSection";
import { cn } from "../../utils/cn";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  prefersReducedMotion: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  onLogout: () => void;
}

const SWIPE_CLOSE_THRESHOLD_PX = 50;

const MobileDrawer = ({
  isOpen,
  onClose,
  prefersReducedMotion,
  isAuthenticated,
  isAdmin,
  onLogout,
}: MobileDrawerProps) => {
  const location = useLocation();
  const touchStartX = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const firstNavLink = panelRef.current?.querySelector<HTMLElement>(
      'nav[aria-label="Navegação principal"] a',
    );
    firstNavLink?.focus();
  }, [isOpen]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || touchStartX.current === null) {
      touchStartX.current = null;
      return;
    }

    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined) {
      touchStartX.current = null;
      return;
    }

    const deltaX = touchStartX.current - endX;
    if (deltaX > SWIPE_CLOSE_THRESHOLD_PX) {
      onClose();
    }

    touchStartX.current = null;
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-[60] lg:hidden"
    >
      <DialogBackdrop
        transition={!prefersReducedMotion}
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm",
          prefersReducedMotion
            ? "duration-0"
            : "duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] data-closed:opacity-0",
        )}
      />

      <DialogPanel
        ref={panelRef}
        id="navigation-menu"
        transition={!prefersReducedMotion}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "fixed inset-y-0 left-0 z-[60] flex h-full w-[85vw] max-w-sm flex-col sb-surface border-r sb-border shadow-2xl shadow-black/40 lg:hidden",
          prefersReducedMotion
            ? "duration-0"
            : "duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] data-closed:-translate-x-full nav-drawer-enter",
        )}
      >
          <UserSection variant="drawer" onNavigate={onClose} />
          <NavLinks
            variant="vertical"
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            onNavigate={onClose}
            onLogout={onLogout}
          />
      </DialogPanel>
    </Dialog>
  );
};

export default MobileDrawer;
