# AGENTS.md

Cross-agent memory for [SarradaBet](https://github.com/SarradaHub/sarradabet): a mock betting platform with real-time odds, optimistic voting, coin purchases via Mercado Pago Pix, and shared TypeScript contracts.

## Project overview

SarradaBet is an **npm workspaces + Turborepo** monorepo. The backend is an Express API with Prisma/PostgreSQL, Socket.io realtime, and Clean Architecture layers. The frontend is a React 19 SPA (Vite + Tailwind). Shared API and realtime contracts live in `@sarradabet/types`.

| Workspace | Path | Purpose |
|-----------|------|---------|
| `api` | `apps/api` | Express REST (`/api/v1`), Socket.io, Prisma, Mercado Pago |
| `web` | `apps/web` | React SPA, optimistic voting, admin UI |
| `@sarradabet/types` | `packages/types` | Shared types for bets, categories, coins, payments, realtime, users |
| `e2e` | `e2e` | Playwright + Gherkin BDD end-to-end tests |

**Local URLs (default)**

| Service | URL |
|---------|-----|
| Web | http://localhost:3002 |
| API | http://localhost:8000 |
| Health | http://localhost:8000/health |
| Socket.io | http://localhost:8000/socket.io |
| Postgres (Docker) | localhost:5433 |
| Redis (Docker) | localhost:6379 |

## Prerequisites

- Node.js **≥ 20** (see root `engines`)
- npm **10.9.0** (`packageManager` in root `package.json`)
- Docker (local Postgres and Redis)
- Git access to clone [`SarradaHub/platform`](https://github.com/SarradaHub/platform) for the web design system (see Build notes)

## Dev environment setup

```bash
git clone https://github.com/SarradaHub/sarradabet.git
cd sarradabet
npm install

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

docker compose up -d db redis
npm run prisma:migrate:dev
npm run db:seed:simple   # optional

npm run dev              # starts api + web in parallel via Turbo
```

**Environment files**

- `apps/api/.env` — copy from `apps/api/.env.example`. Key vars: `DATABASE_URL`, `DIRECT_URL`, `CORS_ORIGINS`, `JWT_SECRET`, `REDIS_URL`, Mercado Pago tokens in `.env.local` (gitignored).
- `apps/web/.env` — copy from `apps/web/.env.example`. For local dev, leave `VITE_API_URL` unset and use the Vite proxy (`/api`, `/socket.io` → port 8000). If set, use base URL only — **no** `/api/v1` suffix.

**Docker Compose service names**

- Postgres service is named `db` (not `postgres`), host port **5433**.
- Redis service is named `redis`, host port **6379**.

**Design system dependency**

The web app depends on `@sarradahub/design-system` from a sibling checkout at `../platform/design-system`. Root `npm run build:design-system` and `scripts/clone-platform.sh` clone `SarradaHub/platform` automatically. CI does the same before build.

## Commands reference

Run from the **repository root** unless noted.

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start `api` and `web` dev servers in parallel |
| `npm run -w apps/api dev` | API only (`tsx watch src/server.ts`) |
| `npm run -w apps/web dev` | Web only (Vite on port 3002) |

### Build and typecheck

| Command | Description |
|---------|-------------|
| `npm run build` | Clone/build design system, then `turbo run build` |
| `npm run build:design-system` | Clone platform repo and build design system |
| `npm run check-types` | Typecheck all workspaces |
| `npm run lint` | ESLint across workspaces |
| `npm run format` | Prettier on `**/*.{ts,tsx,md}` |

### Database (Prisma)

| Command | Description |
|---------|-------------|
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate:dev` | Create/apply dev migrations |
| `npm run prisma:migrate:deploy` | Apply migrations (CI/production) |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:check` | Migration status |
| `npm run db:seed` | Full seed |
| `npm run db:seed:simple` | Minimal seed (used in CI) |
| `npm run db:reset` | Reset DB and run simple seed |

### Testing

| Command | Description |
|---------|-------------|
| `npm test` | All workspace tests via Turbo |
| `npm run test:api` | API tests (Jest) |
| `npm run test:api:unit` | API unit tests only |
| `npm run test:api:integration` | API integration tests only |
| `npm run test:api:coverage` | API with coverage (CI) |
| `npm run test:web` | Web tests (Vitest) |
| `npm run test:web:coverage` | Web with coverage (CI) |
| `npm run test:e2e` | Playwright BDD E2E (full suite) |
| `npm run test:e2e:smoke` | E2E smoke scenarios only (`@smoke`) |

### API-only scripts (`apps/api`)

| Command | Description |
|---------|-------------|
| `npm run mp:setup-store` | Mercado Pago in-store QR store/POS setup |
| `npm run webhook:configure` | Configure ngrok webhook tunnel |
| `npm run webhook:tunnel` | Run ngrok for local Pix webhooks |

See `docs/LOCAL_WEBHOOKS.md` and `docs/features/07-mercadopago-qr-instore.md` for Mercado Pago local testing.

## Repository layout

```
sarradabet/
├── apps/
│   ├── api/                 # Express + Prisma + Socket.io
│   │   ├── prisma/          # schema + migrations
│   │   ├── src/
│   │   │   ├── core/        # Base classes, cache, middleware, errors
│   │   │   ├── modules/     # Feature modules (see below)
│   │   │   ├── realtime/    # Socket.io server + typed emitter
│   │   │   ├── routes/      # Route aggregation
│   │   │   ├── config/      # env.ts, db, auth middleware
│   │   │   ├── app.ts       # Express app
│   │   │   └── server.ts    # HTTP + Socket.io bootstrap
│   │   └── scripts/         # Mercado Pago, ngrok, env helpers
│   └── web/                 # React SPA
│       └── src/
│           ├── core/        # useApi, useQuery, useMutation, useSocket
│           ├── context/     # RealtimeProvider
│           ├── services/    # Axios API clients
│           ├── hooks/       # Domain hooks (useBets, useAuth, …)
│           ├── components/  # UI + feature components
│           └── pages/       # Route pages (admin lazy-loaded)
├── packages/
│   └── types/               # @sarradabet/types — change contracts here first
├── docs/                    # Architecture, API, deployment, feature specs
├── scripts/
│   └── clone-platform.sh    # Clones SarradaHub/platform for design system
├── docker-compose.yml       # db (5433), redis (6379)
├── turbo.json
└── package.json             # Root workspace scripts
```

### API feature modules

Each module follows **repository → service → controller → routes**, extending base classes in `apps/api/src/core/`:

| Module | Path | Domain |
|--------|------|--------|
| `auth` | `modules/auth/` | JWT login, refresh tokens |
| `user` | `modules/user/` | User CRUD |
| `bet` | `modules/bet/` | Markets, odds, resolution |
| `category` | `modules/category/` | Bet categories |
| `coin` | `modules/coin/` | Coin balance and transactions |
| `coin-package` | `modules/coin-package/` | Purchasable coin packages |
| `payment` | `modules/payment/` | Mercado Pago Pix, in-store QR |

Legacy route files also exist under `apps/api/src/routes/` and `apps/api/src/controllers/`; prefer adding new endpoints inside `modules/`.

### Shared types

When changing REST payloads or Socket.io events, update `packages/types/src/` first, then API mappers/services and web consumers in the same change.

Realtime event contracts: `packages/types/src/realtime.ts` (`vote:created`, `bet:created`, `bet:updated`).

Exports: `bet`, `category`, `coin`, `payment`, `realtime`, `user`.

## Architecture conventions

### Backend (Clean Architecture)

```
Presentation  → routes, middleware, controllers
Application   → controllers parse/validate requests
Domain        → services (business logic, Socket.io emission after DB commit)
Infrastructure → repositories (Prisma), external clients (Mercado Pago)
```

- Validate with **Zod** schemas and `ValidationMiddleware`.
- Throw typed errors from `apps/api/src/core/errors/AppError.ts` (`ValidationError`, `NotFoundError`, `ConflictError`, etc.).
- Emit Socket.io events **after** successful database transactions.
- Use `node-cache` via `CacheService` for categories and resolved bets; slim list DTOs via `bet.mapper.ts`.

### Frontend

- Functional React components with TypeScript.
- Data fetching via custom hooks (`useQuery`, `useMutation`) — not React Query.
- `RealtimeProvider` patches the in-memory query cache on Socket.io events.
- Optimistic voting in `VoteSlip` with rollback on error.
- Tailwind CSS for styling; `@sarradahub/design-system` for shared UI primitives.

## Code style

- **TypeScript strict mode** in all workspaces.
- **Naming**: PascalCase (classes, types), camelCase (functions, variables), UPPER_SNAKE_CASE (constants), kebab-case (file names, URLs).
- **Formatting**: Prettier (`npm run format`).
- **Linting**: ESLint per app (`apps/api/eslint.config.mjs`, `apps/web/eslint.config.js`).
- Keep business logic in services, data access in repositories, HTTP handling in controllers.
- Minimize scope: match existing patterns; do not introduce unrelated abstractions.

## Testing instructions

Before finishing a task that changes behavior, run the relevant checks:

```bash
npm run lint
npm run check-types
npm test
```

For focused work:

```bash
npm run test:api:unit          # API unit tests
npm run test:api:integration   # API route integration tests (needs test DB)
npm run test:web               # Vitest + React Testing Library
```

**Test locations**

- API: `apps/api/src/**/__tests__/`, `apps/api/src/__tests__/integration/`
- Web: `apps/web/src/**/__tests__/`

**Test tooling**

- API: Jest, Supertest, Fishery factories in `apps/api/src/__tests__/factories/`
- Web: Vitest, jsdom, React Testing Library

Add or update tests for changed behavior. Integration tests use database `sarradabet_test` (initialized by Docker init script and CI).

## CI pipeline

`.github/workflows/ci.yml` delegates to `SarradaHub/platform/.github/workflows/node-monorepo-ci.yaml` and runs:

1. `npm ci`
2. `npm run lint`
3. `npm run check-types`
4. Clone platform + `npm run build`
5. `prisma generate` + `prisma migrate deploy` + `db:seed:simple`
6. `npm run test:api:coverage` and `npm run test:web:coverage`

PRs targeting `main` or `develop` trigger CI. Large PRs (>1000 changed lines) get an automated warning via `.github/workflows/pr.yml`.

## Security considerations

- Never commit secrets. Use `apps/api/.env.local` for Mercado Pago tokens and other sensitive values.
- `JWT_SECRET`, database URLs, and Mercado Pago credentials must be set in deployment environments.
- `CORS_ORIGINS` must include the web app origin or Socket.io connections fail.
- Input validation via Zod on all mutating endpoints; Helmet, rate limiting, and request sanitization middleware are enabled.
- Prisma ORM prevents SQL injection; sanitize user-facing error messages on the frontend.
- Mercado Pago webhooks require HTTPS — use ngrok locally (`npm run webhook:tunnel`, `npm run webhook:configure`).
- Set `MERCADOPAGO_MOCK_PIX=true` for local Pix testing without real payments when appropriate.

## Pull request and commit guidelines

**Branches**: `feature/…`, `fix/…`, `refactor/…`, `docs/…`

**Commits**: [Conventional Commits](https://www.conventionalcommits.org/) — `type(scope): description`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:

```
feat(bets): add bet closure endpoint
fix(auth): handle expired refresh token
docs(api): document coin purchase flow
```

**PR requirements**

- Clear description; link related issues
- Screenshots for UI changes
- Update `packages/types` and docs when changing API or realtime contracts
- All CI checks green before merge
- Prefer smaller PRs (CI warns above 1000 changed lines)

## Feature work

Planned and in-progress features are documented in `docs/features/`. Read the relevant guide before implementing:

| Guide | Topic | Status |
|-------|-------|--------|
| `docs/features/01-user-auth-and-crud.md` | Auth & user CRUD | Complete |
| `docs/features/02-coins-and-pix-payments.md` | Coins & Pix | Complete (online Pix) |
| `docs/features/03-bet-closure-and-payout.md` | Bet closure | Done |
| `docs/features/04-gamification-and-rewards.md` | Gamification | Done |
| `docs/features/05-dashboard-and-analytics.md` | Analytics | Done |
| `docs/features/06-mobile-app-and-admin-panel.md` | Mobile & admin | Planned |
| `docs/features/07-mercadopago-qr-instore.md` | In-store QR | Complete |

Recommended order: 01 → 02 → 03 → 04 → 05 → 06. Feature 07 depends on 02.

## Deployment notes

- **Web**: Vercel, root `apps/web`, requires platform design-system clone at build time.
- **API**: Vercel (`apps/api`) or Render; set `DATABASE_URL`, `DIRECT_URL`, `CORS_ORIGINS`, `JWT_SECRET`.
- **Database**: Supabase in production; use pooler URL for `DATABASE_URL` and direct URL for `DIRECT_URL`.
- **Migrations**: `npm run prisma:migrate:deploy` in CI/production.
- Multi-instance Socket.io requires `@socket.io/redis-adapter` — see `docs/PERFORMANCE.md`.

Full details: `docs/DEPLOYMENT.md`, `docs/PERFORMANCE.md`.

## Documentation index

| Doc | Purpose |
|-----|---------|
| `README.md` | Human-facing overview and quick start |
| `docs/ARCHITECTURE.md` | Layers, realtime flow, caching, error handling |
| `docs/API.md` | REST endpoints and Socket.io payloads |
| `docs/DEVELOPER_GUIDE.md` | Extended setup, feature scaffolding, debugging |
| `docs/DEPLOYMENT.md` | Production deployment |
| `docs/PERFORMANCE.md` | Pooling, compression, scaling |
| `docs/LOCAL_WEBHOOKS.md` | Mercado Pago webhook tunnel setup |

## Agent workflow checklist

When implementing changes:

1. Read the nearest `AGENTS.md` (this file at repo root; add nested files under `apps/*` if package-specific rules emerge).
2. Identify affected workspace (`api`, `web`, or `types`).
3. For API/realtime contract changes, start in `packages/types`.
4. Follow existing module structure and base classes.
5. Run `npm run lint`, `npm run check-types`, and targeted tests.
6. Update relevant docs in `docs/` when behavior or APIs change.
