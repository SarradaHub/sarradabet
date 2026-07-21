# Database Seeding

This directory contains seed files to populate your database with sports betting test data for development and testing.

## Available Seed Files

### 1. `seed-simple.ts` (Recommended for quick testing)

- **Purpose**: Quick setup with basic sports test data
- **Content**: 3 sports categories, 3 bets, 7 odds, 3 votes
- **Use case**: Fast development setup, basic testing

### 2. `seed.ts` (Comprehensive testing scenarios)

- **Purpose**: Comprehensive sports test data with various scenarios
- **Content**: 6 sports categories, 8 bets with different statuses, multiple vote patterns
- **Use case**: Thorough testing of all features and edge cases

## How to Use

### Quick Setup (Recommended)

```bash
# Navigate to the API directory
cd apps/api

# Run the simple seed
npm run db:seed:simple
```

### Comprehensive Setup

```bash
# Navigate to the API directory
cd apps/api

# Run the full seed
npm run db:seed
```

### Reset Database with Fresh Data

```bash
# This will reset the database and run the simple seed
npm run db:reset
```

## Test Scenarios Included

### Simple Seed (`seed-simple.ts`)

- **Futebol**: Brasil vs Argentina with votes
- **Basquete**: NBA Finals bet
- **MMA**: UFC 300 main event with multiple options

### Comprehensive Seed (`seed.ts`)

1. **Futebol**: Brasil vs Argentina Copa América (active, leading favorite)
2. **Basquete**: NBA Finals with tight odds
3. **MMA**: UFC 300 main event with high-odds options
4. **Tênis**: Roland Garros champion (resolved)
5. **Fórmula 1**: F1 championship (closed for betting)
6. **Vôlei**: Superliga champion (no votes yet)
7. **Futebol**: Champions League multi-team prediction
8. **Futebol**: Série B Copa do Brasil underdog (15x odds)

## Sports Categories

- Futebol
- Basquete
- MMA
- Tênis
- Fórmula 1
- Vôlei

## Database States Tested

- ✅ **Open bets** with active voting
- ✅ **Closed bets** (no new votes allowed)
- ✅ **Resolved bets** with winners/losers
- ✅ **Bets with no votes** (new/untested)
- ✅ **Close races** (tight vote counts)
- ✅ **Clear favorites** (one option dominating)
- ✅ **High odds underdogs** (long shot bets)
- ✅ **Multiple odds per bet** (2-4 options)

## Seed Users

Both seeds create:

| Role | Username | Email | Password |
|------|----------|-------|----------|
| `ADMIN` | `admin` | `admin@sarradabet.com` | `admin123` |
| `USER` | `user` | `user@sarradabet.com` | `user123` |

Login via `POST /api/v1/auth/login`. Use `user` for `/coins`, Pix purchases, and protected user routes. Use `admin` for the admin dashboard.

The comprehensive seed also logs sample admin activities in `user_actions`.

## Notes

- All data is sports-only — no politics, entertainment, tech, or economy bets
- All timestamps are realistic (spread over time)
- Vote counts vary to test different UI states
- Odds values range from 1.05x to 15x for variety

## Troubleshooting

If you encounter issues:

1. Make sure your database is running (`docker-compose up -d`)
2. Ensure migrations are up to date (`npm run prisma:migrate:dev`)
3. Check that Prisma client is generated (`npm run prisma:generate`)

## Customizing Seeds

You can modify the seed files to:

- Add more sports categories
- Create specific match scenarios
- Adjust vote patterns
- Change odds values
- Add more admin users

Just run the seed again after making changes!
