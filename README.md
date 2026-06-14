# SarradaBet

SarradaBet is a mock betting platform built as a Turborepo monorepo. It combines an Express API, a React frontend, and shared TypeScript contracts, with real-time odds updates over Socket.io and PostgreSQL.

## Key Features

- Create and manage betting markets, odds, and categories with full CRUD support.
- **Real-time updates** — vote counts and bet changes push instantly to all connected clients via Socket.io (no polling).
- **Optimistic UI** — votes feel instant; the client reconciles with server events on success or rolls back on error.
- Request validation, rate limiting, compression, and structured error responses on the API.
- In-memory caching for categories and resolved bets, plus slim list payloads for faster responses.
- Shared types in `packages/types` (`@sarradabet/types`) consumed by both API and web.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React, Vite, Tailwind CSS — deploy on **Vercel** |
| Backend | Express, Socket.io, Prisma — deploy on **Render** |
| Database | PostgreSQL — **Supabase** (or local Docker) |
| Monorepo | Turborepo, shared `@sarradabet/types` |

## Project Layout

```
sarradabet/
├── apps/
│   ├── api/    # Express API, Prisma, Socket.io, node-cache
│   └── web/    # React SPA, RealtimeProvider, optimistic voting UI
├── packages/
│   └── types/  # Shared contracts (bets, categories, realtime events)
├── docs/       # Architecture, deployment, performance notes
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js ≥ 20
- Docker (for local Postgres), or a Supabase project

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

**Local development (Docker Postgres)** — defaults in `.env.example` work out of the box:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection (`localhost:5433` via Docker) |
| `DIRECT_URL` | Direct Postgres URL for Prisma migrations (same as `DATABASE_URL` locally) |
| `CORS_ORIGINS` | Must include the web dev URL (`http://localhost:3002`) |
| `VITE_API_URL` | Web → API base URL (`http://localhost:8000`) |

**Supabase (production / remote DB)** — edit `apps/api/.env`:

```env
DATABASE_URL=postgresql://...@...pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...@...supabase.com:5432/postgres
```

See [docs/PERFORMANCE.md](docs/PERFORMANCE.md) for pooler setup and query tuning.

### 3. Start the database

```bash
docker compose up -d db
```

The service is named `db` (not `postgres`). Postgres listens on host port **5433**.

### 4. Run migrations

```bash
cd apps/api
npm run prisma:migrate:dev
```

Optional seed:

```bash
npm run db:seed:simple
```

### 5. Start dev servers

From the repository root:

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| API (REST) | http://localhost:8000 |
| API (health) | http://localhost:8000/health |
| Socket.io | http://localhost:8000/socket.io |
| Web | http://localhost:3002 |

Vite proxies `/api` and `/socket.io` to the API in dev, so the web app can talk to the backend without CORS issues when using relative paths. With `VITE_API_URL` set, the client connects directly to the API (ensure `CORS_ORIGINS` includes `http://localhost:3002`).

## Real-Time Events

Event names and payloads are defined in `packages/types/src/realtime.ts`:

| Event | When |
|-------|------|
| `vote:created` | A user votes on an odd |
| `bet:created` | A new bet is created |
| `bet:updated` | Bet updated, closed, or resolved |

The web app wraps routes in `RealtimeProvider`, which patches the query cache when events arrive. Individual `BetCard` components also listen for vote events to update odds locally.

## Deployment

### API (Render)

- Build: `npm run build` (in `apps/api`)
- Start: `npm run start`
- Set `DATABASE_URL`, `DIRECT_URL` (Supabase), `CORS_ORIGINS` (your Vercel URL), `JWT_SECRET`, and `PORT`.
- Render supports WebSockets on the same HTTP service — no extra config needed for a single instance.

### Web (Vercel)

- Root directory: `apps/web`
- Build: `npm run build`
- Set `VITE_API_URL` to your Render API URL (e.g. `https://your-api.onrender.com`).
- [`apps/web/vercel.json`](apps/web/vercel.json) configures SPA rewrites and long-lived cache headers for hashed assets.

### Database migrations (CI / production)

```bash
npm run prisma:migrate:deploy
```

Requires `DATABASE_URL` and `DIRECT_URL` secrets (see `.github/workflows/deploy.yml`).

More detail: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/PERFORMANCE.md](docs/PERFORMANCE.md).

## Testing

```bash
# All workspaces
npm test

# API only
npm run test:api

# Web only
npm run test:web
```

## Security and Observability

- Helmet, CORS, rate limiting, and response compression on the API.
- Zod validation on all request bodies and query params.
- Winston logging with structured output.
- Admin routes use JWT auth (`JWT_SECRET`); public bet/vote endpoints remain open.

## Contributing

Open a pull request with proposed changes and include automated test coverage. When changing API or realtime contracts, update `packages/types` and any downstream consumers in the same PR.
