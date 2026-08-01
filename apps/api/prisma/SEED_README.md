# Database Seeding

This directory contains seed files to populate your database with soccer betting test data for development and testing. All scenarios use **2026** season context and match the current `schema.prisma` models.

## Schema coverage

| Model / field | Simple seed | Full seed |
|---------------|-------------|-----------|
| `User` (`role`, `coinBalance`, …) | yes | yes |
| `CoinPackage` | Pacote Básico | Pacote Básico |
| `Category` | Futebol | Futebol |
| `Bet.status` (`open`, `scheduled`, `closed`, `resolved`) | open + scheduled | all four |
| `Bet.startTime` / `Bet.closesAt` | all bets | all bets |
| `Bet.resolvedAt` | — | resolved bet |
| `Odd.result` (`pending`, `won`, `lost`) | pending | pending + won/lost on resolved bet |
| `Vote.userId` / `Vote.amount` | yes | yes |
| `Vote.status` (`pending`, `paid`, `lost`) | pending | pending + paid/lost on resolved bet |
| `Vote.payoutAmount` / `Vote.paidAt` | — | paid winners on resolved bet |
| Multiple votes per user per odd | yes | yes |
| `UserAction` | — | create + resolve audit rows |
| `house` system user (takeout treasury) | yes (balance 0) | yes + `TAKEOUT` on resolved bet |
| `CoinTransaction` / `PixPayment` | not seeded | `TAKEOUT` on resolved bet only |
| `UserStats` (ranking / win rate) | synthetic leaderboard | from resolved Copa do Brasil |
| `Reward` (catalog) | 4 rewards | 4 rewards |
| `RewardRedemption` (ticket) | — | 1 pending ticket for `pedro` |

Coin balances on users are **preset** for convenience; seeds do not write matching `coin_transactions` rows for every vote. Runtime voting debits coins via the API. Reward redemptions in the full seed are **display-only** (ticket row without coin debit) for admin validation testing.

## Available seed files

### 1. `seed-simple.ts` (recommended for quick testing)

- **Purpose**: Quick setup for e2e and local dev
- **Content**: 1 category, 6 users, 1 coin package, 4 bets (3 open, 1 scheduled), 13 votes, synthetic `UserStats`, rewards catalog
- **Use case**: `npm run db:seed:simple` (also used in CI)

### 2. `seed.ts` (comprehensive testing scenarios)

- **Purpose**: Full lifecycle and payout states
- **Content**: 1 category, 6 users, 1 coin package, 6 bets (3 open, 1 scheduled, 1 closed, 1 resolved), paid/lost votes, admin actions, stats from resolved bet, rewards + sample ticket
- **Use case**: `npm run db:seed`

## How to use

### Quick setup (recommended)

```bash
npm run db:seed:simple
```

### Comprehensive setup

```bash
npm run db:seed
```

### Reset database with fresh data

```bash
npm run db:reset
```

## Seed users (6 total)

| Role | Username | Email | Password | Coins |
|------|----------|-------|----------|-------|
| ADMIN | `admin` | `admin@sarradabet.com` | `admin123` | 900 |
| USER | `user` | `user@sarradabet.com` | `user123` | 900 |
| USER | `maria` | `maria@sarradabet.com` | `user123` | 800 |
| USER | `joao` | `joao@sarradabet.com` | `user123` | 750 |
| USER | `pedro` | `pedro@sarradabet.com` | `user123` | 600 |
| USER | `lucas` | `lucas@sarradabet.com` | `user123` | 550 |

Balances are static starting values (not recomputed from vote stakes). E2e scenarios reset `user` to 1000 coins via API when needed.

Login via `POST /api/v1/auth/login`. E2e tests log in as `admin` or `user` only; extra users appear in the admin user list and parimutuel pools.

### House treasury user

| Username | Purpose | Login | Initial balance (full seed) |
|----------|---------|-------|----------------------------|
| `house` | Accumulates parimutuel takeout (`TAKEOUT` transactions) | Not for login | 138 after resolved Copa do Brasil pool (550 × 25%) |

The admin dashboard **Receita da casa** stat reads this user's `coinBalance`.

## Gamification (Feature 04)

Ranking uses the same formula as the API (defaults from `.env`):

```
rankingScore = (wonBets × 10) + (coinBalance × 0.1)
winRate = totalBets > 0 ? wonBets / totalBets : 0
tier: bronze (< 50), silver (≥ 50), gold (≥ 200)
```

### User stats — simple seed (synthetic)

Synthetic stats for leaderboard UI testing (no resolved bets in this seed):

| User | Won | Lost | Total | Score (approx.) | Tier |
|------|-----|------|-------|-----------------|------|
| `admin` | 5 | 2 | 7 | 140 | silver |
| `user` | 4 | 3 | 7 | 130 | silver |
| `maria` | 3 | 2 | 5 | 110 | silver |
| `joao` | 2 | 3 | 5 | 95 | silver |
| `pedro` | 1 | 4 | 5 | 70 | silver |
| `lucas` | 0 | 0 | 0 | 55 | silver |

### User stats — full seed (from resolved bet)

Derived from **Copa do Brasil 2026** resolution only (open-bet votes do not affect stats):

| User | Won | Lost | Source |
|------|-----|------|--------|
| `user` | 1 | 0 | paid on `Não` |
| `admin` | 1 | 0 | paid on `Não` |
| `joao` | 1 | 0 | paid on `Não` |
| `maria` | 0 | 1 | lost on `Sim` |
| `pedro` | 0 | 1 | lost on `Sim` |
| `lucas` | 0 | 0 | no resolved votes |

### Rewards catalog (both seeds)

| Title | Cost | Stock | Visible in `/rewards` |
|-------|------|-------|------------------------|
| Camisa Oficial | 1000 | 10 | yes |
| Boné SarradaBet | 500 | 20 | yes |
| Caneca Exclusiva | 250 | 5 (simple) / 4 (full) | yes |
| Ingresso VIP | 2000 | 0 | no (out of stock) |

Public catalog hides inactive rewards and `stock = 0`.

### Sample ticket (full seed only)

| Field | Value |
|-------|-------|
| User | `pedro` |
| Reward | Caneca Exclusiva |
| Ticket code | `550e8400-e29b-41d4-a716-446655440000` |
| Status | Pending validation (`validatedAt` is null) |

Use **Admin → Recompensas → Validar ticket** to test validation flow.

## Coin package

| Name | Price | Coins | Active |
|------|-------|-------|--------|
| Pacote Básico | R$ 5,00 (500 cents) | 100 | yes |

## Soccer bets (2026 season)

| # | Title | Status | Schedule | In simple seed |
|---|-------|--------|----------|----------------|
| 1 | Brasil vs Argentina - Quem ganha? | `open` | start 2026-04-10, closes 2026-08-31 | yes |
| 2 | Campeão da Champions League 2026 | `open` | start 2026-05-01, closes 2026-09-15 | yes |
| 3 | Libertadores 2026 - Campeão | `open` | start 2026-06-01, closes 2026-10-01 | yes |
| 4 | Mundial 2026 - Artilheiro | `scheduled` | opens 2026-08-01, closes 2026-08-15 | yes |
| 5 | Brasileirão 2026 - Campeão | `closed` | start 2026-05-15, closed 2026-06-15 | full seed only |
| 6 | Copa do Brasil 2026 - Zebra da Série B | `resolved` | resolved 2026-07-10 | full seed only |

Scheduled bets have odds but **no votes** (wagering blocked until `startTime`).

### Vote rules (parimutuel)

- Each `Vote` row is a separate ticket with its own `amount`.
- Users may place **multiple tickets on the same odd** and **cover multiple outcomes** on the same bet (e.g. Brasil + Argentina).
- There is no unique constraint on `(userId, oddId)` — only an index for lookups.

### Vote distribution (simple seed)

| Bet | Voters |
|-----|--------|
| Brasil vs Argentina | Brasil → `user` (100 + 50, two tickets), `admin`; Argentina → `maria`, `joao`, `user` (75) |
| Champions League 2026 | Manchester City → `maria`, `pedro`; Real Madrid → `joao`, `lucas` |
| Libertadores 2026 | Flamengo → `pedro`; Palmeiras → `lucas`; Boca → `maria` |
| Mundial 2026 - Artilheiro | *(no votes — scheduled)* |

**E2e voting target:** `user` has no prior vote on odd `Real Madrid` (Champions League bet). Use that odd for stake/voting scenarios.

### Full seed extras

- **Brasileirão 2026** — `closed` bet with votes placed before close
- **Copa do Brasil 2026** — `resolved`; winning `Não` odds marked `won`, losing `Sim` odds marked `lost`; winning votes `paid` with `payoutAmount`, losing votes `lost`
- Admin `user_actions` for bet create and resolve
- `UserStats` aligned with Copa do Brasil winners/losers
- Pending reward redemption ticket for admin validation

## Temporal context

Timestamps use **2026** dates:

- Users: Jan–Mar 2026
- Open bets: Apr–Jun 2026 creation; `startTime` at open, `closesAt` Aug–Oct 2026
- Scheduled bet: created Jun 2026, opens Aug 2026
- Closed bet: created May 2026, closes Jun 2026
- Resolved bet: created Apr 2026, resolved Jul 2026
- Reward redemption (full seed): Jul 2026

## Database states tested (full seed)

- Open bets with active voting
- Scheduled bets (blocked until `startTime`)
- Closed bets (no new votes)
- Resolved bets with `paid` / `lost` vote statuses
- Multi-user, multi-ticket parimutuel pools
- High and low stake distributions
- Leaderboard with tier bands (bronze / silver / gold)
- Rewards catalog with in-stock and out-of-stock items
- Admin ticket validation (pending redemption)

## Troubleshooting

If you encounter issues:

1. Make sure your database is running (`docker compose up -d db redis`)
2. Ensure migrations are up to date (`npm run prisma:migrate:dev`)
3. Check that Prisma client is generated (`npm run prisma:generate`)

If `prisma migrate dev` reports a modified migration checksum, see the Feature 04 migration notes or run `npm run db:reset` for a clean dev database.

## Customizing seeds

You can modify the seed files to add users, bets, schedules, vote patterns, stats, or rewards. Ranking helpers live in `src/modules/stats/utils/ranking.ts` and are imported by both seed scripts. Run the seed again after making changes.
