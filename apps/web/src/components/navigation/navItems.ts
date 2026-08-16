export const NAV_GROUP_LABELS = {
  main: "Principal",
  account: "Conta",
  admin: "Admin",
} as const;

export type NavGroup = keyof typeof NAV_GROUP_LABELS;

export interface NavLinkItem {
  type: "link";
  to: string;
  label: string;
  group: NavGroup;
  requiresAuth?: boolean;
  requiresGuest?: boolean;
  requiresAdmin?: boolean;
}

export interface NavActionItem {
  type: "action";
  label: string;
  action: "logout";
  group: NavGroup;
  requiresAuth?: boolean;
}

export type NavItem = NavLinkItem | NavActionItem;

export const NAV_ITEMS: NavItem[] = [
  { type: "link", to: "/", label: "Início", group: "main" },
  { type: "link", to: "/leaderboard", label: "Ranking", group: "main" },
  { type: "link", to: "/rewards", label: "Recompensas", group: "main" },
  {
    type: "link",
    to: "/login",
    label: "Entrar",
    group: "main",
    requiresGuest: true,
  },
  {
    type: "link",
    to: "/register",
    label: "Cadastrar",
    group: "main",
    requiresGuest: true,
  },
  {
    type: "link",
    to: "/coins",
    label: "Moedas",
    group: "account",
    requiresAuth: true,
  },
  {
    type: "link",
    to: "/dashboard",
    label: "Dashboard",
    group: "account",
    requiresAuth: true,
  },
  {
    type: "link",
    to: "/profile",
    label: "Perfil",
    group: "account",
    requiresAuth: true,
  },
  {
    type: "link",
    to: "/admin/dashboard",
    label: "Admin",
    group: "admin",
    requiresAuth: true,
    requiresAdmin: true,
  },
  {
    type: "action",
    label: "Sair",
    action: "logout",
    group: "account",
    requiresAuth: true,
  },
];

export function getVisibleNavItems(
  isAuthenticated: boolean,
  isAdmin: boolean,
): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (item.type === "link" && item.requiresGuest && isAuthenticated) {
      return false;
    }
    if (item.requiresAuth && !isAuthenticated) {
      return false;
    }
    if (item.type === "link" && item.requiresAdmin && !isAdmin) {
      return false;
    }
    return true;
  });
}

export function groupNavItems(items: NavItem[]): Map<NavGroup, NavItem[]> {
  const groups = new Map<NavGroup, NavItem[]>();

  for (const item of items) {
    const existing = groups.get(item.group) ?? [];
    existing.push(item);
    groups.set(item.group, existing);
  }

  return groups;
}
