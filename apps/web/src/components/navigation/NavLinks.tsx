import { useMemo } from "react";
import { Link, useLocation } from "react-router";
import {
  getVisibleNavItems,
  groupNavItems,
  NAV_GROUP_LABELS,
  type NavGroup,
  type NavItem,
} from "./navItems";
import { cn } from "../../utils/cn";

interface NavLinksProps {
  variant: "horizontal" | "vertical";
  isAuthenticated: boolean;
  isAdmin: boolean;
  onNavigate?: () => void;
  onLogout?: () => void;
}

function isPathActive(currentPath: string, targetPath: string): boolean {
  if (targetPath === "/") {
    return currentPath === "/";
  }

  return (
    currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
  );
}

function NavLinkItem({
  item,
  variant,
  isActive,
  onNavigate,
}: {
  item: Extract<NavItem, { type: "link" }>;
  variant: "horizontal" | "vertical";
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const isHorizontal = variant === "horizontal";

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "font-medium transition-colors motion-reduce:transition-none",
        isHorizontal
          ? cn(
              "inline-flex min-h-[44px] items-center px-3 py-2 text-sm rounded-md",
              isActive
                ? "text-warning-400 underline decoration-warning-400 decoration-2 underline-offset-4"
                : "text-sportsbook-muted hover:text-warning-400",
            )
          : cn(
              "flex w-full min-h-[44px] items-center px-4 py-3 text-sm",
              isActive
                ? "sb-nav-active text-sportsbook-fg"
                : "text-sportsbook-muted hover:bg-white/5 hover:text-warning-400",
            ),
      )}
    >
      {item.label}
    </Link>
  );
}

function NavActionButton({
  item,
  variant,
  onNavigate,
  onLogout,
}: {
  item: Extract<NavItem, { type: "action" }>;
  variant: "horizontal" | "vertical";
  onNavigate?: () => void;
  onLogout?: () => void;
}) {
  const isHorizontal = variant === "horizontal";

  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.();
        onLogout?.();
      }}
      className={cn(
        "font-medium text-sportsbook-muted transition-colors hover:text-warning-400 motion-reduce:transition-none",
        isHorizontal
          ? "inline-flex min-h-[44px] items-center px-3 py-2 text-sm rounded-md"
          : "flex w-full min-h-[44px] items-center px-4 py-3 text-left text-sm hover:bg-white/5",
      )}
    >
      {item.label}
    </button>
  );
}

const GROUP_ORDER: NavGroup[] = ["main", "account", "admin"];

const NavLinks = ({
  variant,
  isAuthenticated,
  isAdmin,
  onNavigate,
  onLogout,
}: NavLinksProps) => {
  const location = useLocation();

  const visibleItems = useMemo(
    () => getVisibleNavItems(isAuthenticated, isAdmin),
    [isAuthenticated, isAdmin],
  );

  const groupedItems = useMemo(
    () => groupNavItems(visibleItems),
    [visibleItems],
  );

  const isHorizontal = variant === "horizontal";

  if (isHorizontal) {
    return (
      <nav
        aria-label="Navegação principal"
        className="flex flex-wrap items-center gap-1"
      >
        {visibleItems.map((item) => {
          if (item.type === "action") {
            return (
              <NavActionButton
                key={item.label}
                item={item}
                variant={variant}
                onNavigate={onNavigate}
                onLogout={onLogout}
              />
            );
          }

          return (
            <NavLinkItem
              key={item.to}
              item={item}
              variant={variant}
              isActive={isPathActive(location.pathname, item.to)}
              onNavigate={onNavigate}
            />
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto py-2">
      {GROUP_ORDER.map((group) => {
        const items = groupedItems.get(group);
        if (!items?.length) {
          return null;
        }

        return (
          <div key={group} className="py-1">
            <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sportsbook-muted">
              {NAV_GROUP_LABELS[group]}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                if (item.type === "action") {
                  return (
                    <li key={item.label}>
                      <NavActionButton
                        item={item}
                        variant={variant}
                        onNavigate={onNavigate}
                        onLogout={onLogout}
                      />
                    </li>
                  );
                }

                return (
                  <li key={item.to}>
                    <NavLinkItem
                      item={item}
                      variant={variant}
                      isActive={isPathActive(location.pathname, item.to)}
                      onNavigate={onNavigate}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
};

export default NavLinks;
