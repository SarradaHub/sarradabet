# Roadmap

Single source of truth for **planned** work. Shipped features are documented in [API.md](./API.md), [ARCHITECTURE.md](./ARCHITECTURE.md), and [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) — not here.

## Product

### Feature 06 — Mobile app & advanced admin

Detailed spec: [features/06-mobile-app-and-admin-panel.md](./features/06-mobile-app-and-admin-panel.md)

| Item | Status |
|------|--------|
| `apps/mobile` (Expo) | Planned |
| `@sarradabet/api-client` shared package | Planned |
| Push notifications (Expo) | Planned |
| Admin user list with search | Planned |
| Admin ban/unban | Planned |
| Admin manual coin adjust (`ADMIN_ADJUSTMENT`) | Planned |
| Admin Pix payment monitor UI | Planned |

**Already shipped (not on this list):** web admin for bets, categories, coin packages, rewards CRUD, analytics dashboards, basic user management pages.

## Action plans

Executable agent/developer plans. All **Planned**.

| # | Initiative | Guide |
|---|------------|-------|
| 01 | Social login (Google + Facebook OAuth) | [action-plans/01-social-login.md](./action-plans/01-social-login.md) |
| 03 | Admin coin management (audit trail) | [action-plans/03-admin-coin-management.md](./action-plans/03-admin-coin-management.md) |
| 04 | Financial disclaimers (PT/EN) | [action-plans/04-disclaimers.md](./action-plans/04-disclaimers.md) |
| 05 | UX flow, breadcrumbs, 404 page | [action-plans/05-ux-flow-breadcrumbs.md](./action-plans/05-ux-flow-breadcrumbs.md) |
| 06 | Supabase Storage reward image upload | [action-plans/06-supabase-upload.md](./action-plans/06-supabase-upload.md) |

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
