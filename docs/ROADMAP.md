# Roadmap

Single source of truth for **planned** work. Shipped features are documented in [API.md](./API.md), [ARCHITECTURE.md](./ARCHITECTURE.md), and [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) — not here.

## Product

### Feature 06 — Mobile app & advanced admin

Detailed spec: [features/06-mobile-app-and-admin-panel.md](./features/06-mobile-app-and-admin-panel.md)

| Item | Status | Action plan |
|------|--------|-------------|
| Admin user list with search | Planned | [07-admin-user-ban.md](./action-plans/07-admin-user-ban.md) |
| Admin ban/unban | Planned | [07-admin-user-ban.md](./action-plans/07-admin-user-ban.md) |
| Admin Pix payment monitor UI | Planned | [08-admin-pix-monitor.md](./action-plans/08-admin-pix-monitor.md) |
| `@sarradabet/api-client` + native refresh | Planned | [09-api-client-native-refresh.md](./action-plans/09-api-client-native-refresh.md) |
| `apps/mobile` (Expo) core | Planned | [10-mobile-app-core.md](./action-plans/10-mobile-app-core.md) |
| Mobile coins (Pix) & dashboard | Planned | [11-mobile-coins-dashboard.md](./action-plans/11-mobile-coins-dashboard.md) |
| Push notifications (Expo) | Planned | [12-push-notifications.md](./action-plans/12-push-notifications.md) |

**Already shipped (not on this list):** admin manual coin adjust (`ADMIN_ADJUSTMENT`), web admin for bets, categories, coin packages, rewards CRUD, analytics dashboards, basic user management pages (list/edit/delete + coin adjust).

## Action plans

Executable agent/developer plans.

| # | Initiative | Guide |
|---|------------|-------|
| 01 | Social login (Google + Facebook OAuth) | Planned — [01-social-login.md](./action-plans/01-social-login.md) |
| 04 | Financial disclaimers (PT/EN) | Shipped — [04-disclaimers.md](./action-plans/04-disclaimers.md) |
| 05 | UX flow, breadcrumbs, 404 page | Shipped — [05-ux-flow-breadcrumbs.md](./action-plans/05-ux-flow-breadcrumbs.md) |
| 06 | Supabase Storage reward image upload | Shipped — [06-supabase-upload.md](./action-plans/06-supabase-upload.md) |
| 07–12 | Feature 06 remaining (admin + mobile) | Planned — [action-plans/README.md](./action-plans/README.md) |

## Documentation backlog

| Item | Status |
|------|--------|
| Security best practices guide | Planned |
| Monitoring and alerting runbook | Planned |
| API versioning policy | Planned |
| Advanced testing strategies | Planned |
| CI/CD deep-dive (beyond `.github/workflows/`) | Planned |

## How to update

1. When work **ships**: remove the item from this file; document behavior in the relevant living doc (`API.md`, `ARCHITECTURE.md`, etc.).
2. When an action plan completes: trim or delete its plan doc; remove from the action-plans table above.
3. When a new initiative starts: add a row here and (optionally) an action-plan or feature spec under `docs/features/` or `docs/action-plans/`.
