# AGENTS.md

Cross-agent memory for [SarradaBet](https://github.com/SarradaHub/sarradabet): a mock betting platform with real-time parimutuel odds, authenticated stake voting, coin purchases via Mercado Pago Pix (online + instore QR), gamification, and shared TypeScript contracts.

> **Purpose:** Primes Cursor Agent/Composer with repo context — what is **shipped**, what is **planned**, coding standards, and gotchas.  
> **Last updated:** 2026-08-09  
> **Maintainer:** Update when features ship or architecture changes.

---

## 1. Project baseline

| Aspect | Detail |
|--------|--------|
| **Repository** | npm workspaces + Turborepo monorepo |
| **Package manager** | npm 10.9.0 |
| **Node** | ≥ 20 |
| **API** | `apps/api` — Express, Prisma, Socket.io, Bull, Redis |
| **Web** | `apps/web` — React 19 SPA (Vite + Tailwind + `@sarradahub/design-system`) |
| **Mobile** | `apps/mobile` — **Planned** (Feature 06) |
| **Shared packages** | `@sarradabet/types` only today; `@sarradabet/api-client` **Planned** |
| **Database** | PostgreSQL (local Docker; Supabase in production) |
| **Cache & queues** | Redis + Bull (ioredis) |
| **Auth** | JWT access token + HttpOnly refresh cookie (web); Bearer for API clients |
| **Realtime** | Socket.io |
| **State (web)** | Custom `useQuery` / `useMutation` — not React Query |
| **E2E** | `e2e/` — Playwright + Gherkin BDD |

### Local URLs (default)

| Service | URL |
|---------|-----|
| Web | http://localhost:3002 |
| API | http://localhost:8000 |
| Health | http://localhost:8000/health |
| Ready | http://localhost:8000/ready |
| Socket.io | http://localhost:8000/socket.io |
| Postgres (Docker `db`) | localhost:5433 |
| Redis (Docker `redis`) | localhost:6379 |

### Environment variables (critical)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` / `DIRECT_URL` | Prisma (pooler + direct for migrations) |
| `JWT_SECRET` | JWT signing |
| `REDIS_URL` | Token blacklist, leaderboard, dashboard cache, Bull |
| `CORS_ORIGINS` | Must include web origin for Socket.io |
| `MERCADOPAGO_ACCESS_TOKEN` | Pix online + instore |
| `MERCADOPAGO_WEBHOOK_SECRET` | Webhook HMAC validation |
| `MERCADOPAGO_STORE_ID`, `MERCADOPAGO_POS_ID`, `MERCADOPAGO_POS_UUID` | Instore QR |
| `BET_TAKEOUT_RATE`, `HOUSE_USER_USERNAME` | Parimutuel house takeout |
| `MERCADOPAGO_MOCK_PIX` | Local Pix without real MP |

Full list: [`apps/api/.env.example`](apps/api/.env.example). Mercado Pago local testing: [`docs/LOCAL_WEBHOOKS.md`](docs/LOCAL_WEBHOOKS.md).

### Dev setup

```bash
git clone https://github.com/SarradaHub/sarradabet.git
cd sarradabet
npm install

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

docker compose up -d db redis
npm run prisma:migrate:dev
npm run db:seed:simple   # optional

npm run dev              # api + web via Turbo
```

**Web env:** leave `VITE_API_URL` unset for Vite proxy. **Design system:** `npm run build:design-system` clones/builds `@sarradahub/design-system` from `SarradaHub/platform`.

---

## 2. Coding standards & patterns

### Backend (Express modules)

- New endpoints → `apps/api/src/modules/<feature>/` (repository → service → controller → routes).
- Legacy routes under `apps/api/src/routes/` and `controllers/` still exist (votes, webhooks, jobs) — prefer modules for new work.
- Validate with **Zod** + `ValidationMiddleware`.
- Throw typed errors from `apps/api/src/core/errors/AppError.ts`.
- Emit Socket.io events **after** successful DB transactions.
- Coin balance writes → use `prisma.$transaction` via `CoinService`.

### Frontend (Vite React SPA)

- Functional components + TypeScript.
- Data: custom `useQuery`, `useMutation`, `useSocket` — not React Query.
- `RealtimeProvider` patches query cache on Socket.io events.
- Optimistic voting in `VoteSlip` with rollback on error.
- Admin routes lazy-loaded; `@sarradahub/design-system` for shared UI.

### Shared types

- Cross-boundary contracts → `packages/types/src/` first, then API mappers and web consumers.
- Realtime: `packages/types/src/realtime.ts`.

### Imports

- Follow existing app conventions (`apps/api/src/...`, `apps/web/src/...`).
- Shared: `@sarradabet/types`.

### Style

- TypeScript strict; Prettier; ESLint per workspace.
- Conventional Commits: `feat(scope): description`.

---

## 3. Current feature state

| Domain | Status | Key areas |
|--------|--------|-----------|
| User auth & CRUD | Shipped | `modules/auth/`, `modules/user/`, JWT + refresh rotation, Redis blacklist |
| Coins & Pix (online) | Shipped | `modules/coin/`, `modules/payment/` — Pix create/status, webhook |
| Bet closure & payout | Shipped | Parimutuel odds, authenticated stake votes, Bull bet-status job |
| Gamification & rewards | Shipped | Leaderboard, stats, rewards redeem, ticket verify/PNG |
| Dashboard & analytics | Shipped | User dashboard, admin analytics + CSV export |
| Mercado Pago QR instore | Shipped | Instore orders, webhook, Coins page tab |
| Mobile & advanced admin | **Planned** | See [Feature 06](docs/features/06-mobile-app-and-admin-panel.md) |

**Planned initiatives:** [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/action-plans/](docs/action-plans/) (social login, disclaimers, breadcrumbs, Supabase upload).

---

## 4. Key API & Socket.io contracts

Base: `http://localhost:8000/api/v1`. Full reference: [`docs/API.md`](docs/API.md).

| Method | Route | Auth | Notes |
|--------|-------|------|-------|
| POST | `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout` | Public | Refresh via HttpOnly cookie |
| GET | `/bets`, `/categories`, `/leaderboard`, `/rewards` | Public | Filters on bets |
| POST | `/votes` | **Required** | Body `{ oddId, amount }` — debits coins |
| POST | `/bets` | Required | Odds titles only at create (parimutuel) |
| POST | `/payments/pix`, `/payments/instore` | Required | Online + instore QR |
| GET | `/users/me/dashboard` | Required | User dashboard |
| POST | `/rewards/:id/redeem` | Required | Generates ticket |
| GET/POST | `/admin/rewards`, `/admin/analytics/*` | Admin | CRUD + analytics |
| POST | `/admin/users/:id/coins/adjust` | Admin | Credit/debit + audit log |
| POST | `/webhooks/mercadopago` | MP HMAC | No JWT |

**Not shipped (Planned — Feature 06):** `PATCH /admin/users/:id/ban`, `GET /admin/payments/pix`.

### Socket.io events

| Event | Scope |
|-------|-------|
| `vote:created` | Broadcast — includes `totalStake` |
| `bet:created`, `bet:updated` | Broadcast — `BetListItem` |
| `bet:resolved`, `payment:confirmed`, `reward:validated` | User room `user:{userId}` |

Payloads: `packages/types/src/realtime.ts`.

---

## 5. Data model highlights (Prisma)

Coins and stakes use **Int** (not Decimal). `Odd.value` is Float (parimutuel-calculated).

```prisma
model User {
  id           Int      @id @default(autoincrement())
  username     String   @unique
  email        String   @unique
  role         UserRole @default(USER)
  coinBalance  Int      @default(0)
  votes        Vote[]
  // isBanned — Planned (Feature 06)
}

model Bet {
  status     BetStatus  // scheduled | open | closed | resolved
  startTime  DateTime?
  closesAt   DateTime?
  categoryId Int        // required
  odds       Odd[]
}

model Vote {
  userId  Int
  oddId   Int
  amount  Int           // coin stake
  status  VoteStatus    // pending | paid | lost
}
```

Schema: [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma).

---

## 6. Gotchas

### Money & stakes

- Coin balances and vote `amount` are **Int** in Prisma.
- `POST /votes` requires auth + sufficient balance; not anonymous.
- Parimutuel: odd values computed from stakes, not fixed at bet creation.

### Auth

- Web: HttpOnly refresh cookie on `/api/v1/auth`; send `credentials: 'include'`.
- Access token blacklist in Redis on logout.
- Mobile auth pattern not implemented yet (Feature 06).

### Dark mode

- **Shipped.** Custom `ThemeProvider` + `ThemeToggle` in [`apps/web/src/context/ThemeProvider.tsx`](../../apps/web/src/context/ThemeProvider.tsx); preference key `sarradabet-theme` (`light` | `dark` | `system`); FOUC boot script in [`apps/web/index.html`](../../apps/web/index.html).

### Realtime & scaling

- Socket.io in-process; multi-instance needs `@socket.io/redis-adapter` — see [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md).

### Mercado Pago

- Webhooks need HTTPS locally → ngrok (`npm run webhook:tunnel`, `webhook:configure`).
- Or `MERCADOPAGO_MOCK_PIX=true` for mock Pix without ngrok.

---

## 7. Commands reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start api + web |
| `npm run build` | Design system + turbo build |
| `npm run lint` / `check-types` / `npm test` | Quality gates |
| `npm run prisma:migrate:dev` | Dev migrations |
| `npm run test:api` / `test:web` / `test:e2e` | Targeted tests |
| `npm run mp:setup-store` | MP instore store/POS |

---

## 8. Planned work

- **[docs/ROADMAP.md](docs/ROADMAP.md)** — SSOT for unshipped items
- **[docs/features/06-mobile-app-and-admin-panel.md](docs/features/06-mobile-app-and-admin-panel.md)** — mobile + ban/coin-adjust/Pix monitor
- **[docs/action-plans/](docs/action-plans/)** — granular plans

Shipped behavior lives in living docs — not in deleted feature guides 01–05/07.

---

## 9. Documentation index

| Doc | Purpose |
|-----|---------|
| [`docs/README.md`](docs/README.md) | Docs hub |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Planned work only |
| [`docs/API.md`](docs/API.md) | REST + Socket.io |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Layers, modules, caching |
| [`docs/DEVELOPER_GUIDE.md`](docs/DEVELOPER_GUIDE.md) | Setup, testing, conventions |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Vercel/Render; Docker templates |
| [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) | Redis, indexes, scaling |
| [`docs/LOCAL_WEBHOOKS.md`](docs/LOCAL_WEBHOOKS.md) | MP webhook tunnel |

---

## 10. Agent workflow checklist

1. Read this file + relevant living doc (`API.md`, `ARCHITECTURE.md`).
2. For new work, check [`docs/ROADMAP.md`](docs/ROADMAP.md) and action plans.
3. API/realtime changes → start in `packages/types`.
4. Follow module structure and base classes in `apps/api/src/core/`.
5. Run `npm run lint`, `npm run check-types`, targeted tests.
6. When shipping: update living docs; remove item from ROADMAP.

---

## 11. CI, security, PR guidelines

**CI** (`.github/workflows/ci.yml`): lint → types → build (with design-system clone) → migrate → test.

**Security:** never commit secrets; use `apps/api/.env.local` for MP tokens; validate all mutating endpoints; Helmet + rate limiting + CORS.

**PRs:** Conventional Commits; update `packages/types` + docs when contracts change; screenshots for UI; CI green.

**Branches:** `feature/…`, `fix/…`, `refactor/…`, `docs/…`

---

## 12. Recent changes log

| Date | Change |
|------|--------|
| 2026-08-13 | Shipped financial disclaimers (PT/EN banner + footer, Coins acknowledge gate) |
| 2026-08-13 | Shipped admin coin adjust API + UI (`ADMIN_ADJUSTMENT`, `AdminAuditLog`) |
| 2026-08-13 | Shipped dark/light mode toggle (ThemeProvider, ThemeToggle, dual CSS palette) |
| 2026-08-09 | Docs cleanup: deleted feature guides 01–05/07; added ROADMAP; refreshed living docs; rewrote AGENTS.md |
| — | Shipped: auth, coins/Pix, bet payout, gamification, analytics, instore QR |

---

**End of AGENTS.md**
