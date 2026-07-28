# E2E Tests (Playwright + BDD)

End-to-end tests for SarradaBet using [Playwright](https://playwright.dev/) and [playwright-bdd](https://github.com/vitalets/playwright-bdd) v9 with Gherkin feature files in Portuguese (PT-BR).

## Prerequisites

- Node.js ≥ 20, npm 10.9
- Docker (Postgres + Redis)
- Monorepo dependencies installed (`npm ci` from repo root)
- Database seeded: `npm run db:seed:simple`

## Local setup

```bash
# From repo root
docker compose up -d db redis
npm run db:seed:simple

# Install Playwright browsers (first time)
cd e2e && npx playwright install chromium
```

## Running tests

Playwright starts API (`:8000`) and web dev server (`:3002`) automatically when `CI` is unset.

```bash
# Full suite (36 scenarios)
npm run test:e2e

# Smoke only (@smoke tag)
npm run test:e2e:smoke

# Admin flows
npm run -w e2e exec -- npx playwright test --grep @admin

# Specific feature
npm run -w e2e exec -- npx playwright test --grep "Gestão de usuários"

# Pix mock flow
npm run -w e2e exec -- npx playwright test --grep @pix

# Regression suite
npm run -w e2e exec -- npx playwright test --grep @regression

# Debug UI
npm run -w e2e test:debug

# HTML report
npm run -w e2e report
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `E2E_BASE_URL` | `http://localhost:3002` | Web app URL |
| `E2E_API_URL` | `http://localhost:8000` | API helpers in fixtures |
| `MERCADOPAGO_MOCK_PIX` | `true` (via webServer env) | Mock Pix for `@pix` scenarios |

API should run with `MERCADOPAGO_MOCK_PIX=true` for `@pix` scenarios.

## Test data

Uses [`db:seed:simple`](../apps/api/prisma/seed-simple.ts) — soccer-only **2026** season data:

| Role | Username | Password |
|------|----------|----------|
| User | `user` | `user123` |
| Admin | `admin` | `admin123` |

Additional seed users (`maria`, `joao`, `pedro`, `lucas`) exist for multi-user pools and admin list tests; e2e login helpers use `admin`/`user` only.

Seed includes 3 open soccer bets (Copa América, Champions League, Libertadores). E2e voting scenarios target odd `Real Madrid` on `Campeão da Champions League 2026`.

API helpers in `fixtures/seed.ts` create/cleanup disposable entities (`@creates-user`, `@creates-bet`, `@creates-category` hooks).

## Structure

```
e2e/
├── features/       # Gherkin (.feature) — 12 feature files
├── steps/          # Step definitions (domain + common)
├── pages/          # Page Object Model
├── fixtures/       # seed.ts API helpers + test state
├── hooks/          # Before/After tag hooks
└── playwright.config.ts
```

## Feature files

| File | Module |
|------|--------|
| `auth.feature` | Login, register, logout, admin login |
| `navegacao.feature` | Protected routes, navigation |
| `perfil.feature` | User profile |
| `apostas-votacao.feature` | Sportsbook, voting, filters |
| `moedas-pix.feature` | Coin balance, Pix purchase |
| `admin-acesso.feature` | Admin access control |
| `admin-dashboard.feature` | Admin stats and quick actions |
| `admin-apostas.feature` | Bet CRUD, close, resolve |
| `admin-categorias.feature` | Category CRUD |
| `admin-pacotes.feature` | Coin package management |
| `admin-usuarios.feature` | User list and delete |

## Tags

| Tag | Usage |
|-----|-------|
| `@smoke` | Critical paths — run in CI |
| `@regression` | Full regression coverage |
| `@admin` | Admin panel flows |
| `@pix` | Pix mock payment flow |
| `@creates-user` | Creates disposable user via API (auto cleanup) |
| `@creates-bet` | Creates disposable bet via API (auto cleanup) |
| `@creates-category` | Creates disposable category via API (auto cleanup) |
| `@creates-closed-bet` | Creates closed bet via API (auto cleanup) |

## CI

[`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml) runs `@smoke` on Chromium for PRs to `main`/`develop`. Reports are uploaded as workflow artifacts.

## Manual scenarios

Real Mercado Pago Pix without mock (`MERCADOPAGO_MOCK_PIX=false`) is not automated — use mock simulate button in `@pix` scenarios instead.
