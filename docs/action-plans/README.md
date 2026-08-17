# Action Plans

Step-by-step, MCP-aware implementation guides for Cursor agents and developers. See [ROADMAP.md](../ROADMAP.md) for the canonical backlog.

| # | Plan | Status | Guide |
|---|------|--------|-------|
| 01 | Social login | Planned | [01-social-login.md](./01-social-login.md) |
| 02 | Dark mode toggle | Shipped | [02-dark-mode-toggle.md](./02-dark-mode-toggle.md) |
| 03 | Admin coin management | Shipped | [03-admin-coin-management.md](./03-admin-coin-management.md) |
| 04 | Financial disclaimers | Shipped | [04-disclaimers.md](./04-disclaimers.md) |
| 05 | UX flow & breadcrumbs | Shipped | [05-ux-flow-breadcrumbs.md](./05-ux-flow-breadcrumbs.md) |
| 06 | Supabase image upload | Shipped | [06-supabase-upload.md](./06-supabase-upload.md) |
| 07 | Admin user ban & search | Planned | [07-admin-user-ban.md](./07-admin-user-ban.md) |
| 08 | Admin Pix payment monitor | Planned | [08-admin-pix-monitor.md](./08-admin-pix-monitor.md) |
| 09 | Native refresh & api-client | Planned | [09-api-client-native-refresh.md](./09-api-client-native-refresh.md) |
| 10 | Expo mobile app core | Planned | [10-mobile-app-core.md](./10-mobile-app-core.md) |
| 11 | Mobile coins & dashboard | Planned | [11-mobile-coins-dashboard.md](./11-mobile-coins-dashboard.md) |
| 12 | Push notifications | Planned | [12-push-notifications.md](./12-push-notifications.md) |

Plans **07–12** implement remaining [Feature 06](../features/06-mobile-app-and-admin-panel.md) work. Suggested order: **07 → 08** (admin), then **09 → 10 → 11/12** (mobile).

Each plan follows TDD, Clean Architecture patterns, and references the current codebase. Shipped behavior belongs in [API.md](../API.md) and [ARCHITECTURE.md](../ARCHITECTURE.md), not in these plans.
