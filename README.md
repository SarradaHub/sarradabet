<div align="center">

# SarradaBet

**Mock betting platform with live parimutuel odds, coin stakes, Pix payments, and realtime updates.**

[![CI](https://github.com/SarradaHub/sarradabet/actions/workflows/ci.yml/badge.svg)](https://github.com/SarradaHub/sarradabet/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Documentation](docs/README.md) · [API](docs/API.md) · [Roadmap](docs/ROADMAP.md) · [Report a bug](https://github.com/SarradaHub/sarradabet/issues)

</div>

## 🌟 Highlights

- **Live odds** — Socket.io pushes stake and parimutuel updates as users vote; no polling.
- **Optimistic voting** — stakes feel instant; the UI rolls back cleanly on error.
- **Coin economy** — buy coins with Mercado Pago Pix (online + instore QR); stake on markets; redeem rewards.
- **Full-stack TypeScript** — Express API + React 19 SPA sharing contracts via `@sarradabet/types`.
- **Production-ready patterns** — JWT auth, Redis caching, Bull jobs, admin analytics, Playwright E2E.

## ℹ️ Overview

SarradaBet is a **mock betting platform** built by [SarradaHub](https://github.com/SarradaHub). It demonstrates a complete betting flow: create markets, stake coins on odds, watch live parimutuel prices, resolve bets, and pay winners — with gamification, leaderboards, and an admin panel on top.

The repo is a **Turborepo monorepo**: `apps/api` (Express + Prisma + Socket.io), `apps/web` (Vite + React), and `packages/types` for shared contracts. PostgreSQL and Redis run locally via Docker; production targets Vercel or Render.

> **Looking for depth?** Architecture, API reference, deployment, and performance notes live in [`docs/`](docs/README.md) — this README is the elevator pitch.

### ✍️ Author

Maintained by **SarradaHub**. Questions, bugs, and feature ideas → [GitHub Issues](https://github.com/SarradaHub/sarradabet/issues).

## ⬇️ Installation

**Requirements:** Node.js ≥ 20, npm 10.9+, Docker (Postgres + Redis).

```bash
git clone https://github.com/SarradaHub/sarradabet.git
cd sarradabet
npm install

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

docker compose up -d db redis
npm run prisma:migrate:dev
npm run dev
```

| Service | URL |
|---------|-----|
| Web | http://localhost:3002 |
| API | http://localhost:8000 |
| Health | http://localhost:8000/health |

Optional seed: `npm run db:seed:simple`. Full setup (env vars, design system, Mercado Pago) → [Developer Guide](docs/DEVELOPER_GUIDE.md).

## 🚀 Usage

1. Open **http://localhost:3002** — browse open bets and live odds.
2. **Register / log in** — stake coins on an odd via the vote slip (optimistic UI + realtime reconciliation).
3. **Admin** — manage bets, categories, rewards, and analytics at `/admin` (admin user from seed or DB).

```bash
# Run the test suite
npm test
```

REST endpoints and Socket.io events → [API documentation](docs/API.md).

## 📚 Documentation

| Doc | What you'll find |
|-----|------------------|
| [Docs hub](docs/README.md) | Index of all documentation |
| [Architecture](docs/ARCHITECTURE.md) | Clean Architecture, modules, realtime, caching |
| [API reference](docs/API.md) | REST + Socket.io contracts |
| [Developer Guide](docs/DEVELOPER_GUIDE.md) | Env, testing, conventions, contributing |
| [Deployment](docs/DEPLOYMENT.md) | Vercel / Render production setup |
| [Performance](docs/PERFORMANCE.md) | Redis, indexes, scaling checklist |
| [Local webhooks](docs/LOCAL_WEBHOOKS.md) | Mercado Pago Pix testing with ngrok |
| [Roadmap](docs/ROADMAP.md) | Planned work (mobile, advanced admin, action plans) |
| [AGENTS.md](AGENTS.md) | Context for Cursor / AI agents |

## 🛠️ Development

Contributors: read the [Developer Guide](docs/DEVELOPER_GUIDE.md) first.

```bash
npm run lint && npm run check-types && npm test
```

Change API or realtime contracts in `packages/types` first, then update API mappers and web consumers in the same PR.

## 🗺️ Roadmap

Planned work only → **[docs/ROADMAP.md](docs/ROADMAP.md)** (mobile app, admin ban/coin adjust, Pix monitor, dark mode, social login, and more).

## 🤝 Contributing

Contributions welcome.

1. Fork the repo and create a branch (`feature/…`, `fix/…`, `docs/…`).
2. Follow [Conventional Commits](https://www.conventionalcommits.org/).
3. Open a PR with a clear description; keep CI green.

See [Developer Guide → Contributing](docs/DEVELOPER_GUIDE.md) for workflow details.

## 🙏 Acknowledgments

[Turborepo](https://turbo.build/) · [Prisma](https://www.prisma.io/) · [Socket.io](https://socket.io/) · [Supabase](https://supabase.com/) · [Vercel](https://vercel.com/) · [SarradaHub/platform](https://github.com/SarradaHub/platform) (`@sarradahub/design-system`)

README structure inspired by [How to write a good README](https://github.com/banesullivan/README).
