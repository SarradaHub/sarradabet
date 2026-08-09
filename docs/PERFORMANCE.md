# Performance Guide

Cross-links: [Architecture](./ARCHITECTURE.md#caching-and-performance-layers) | [API caching headers](./API.md#http-caching-and-compression) | [Deployment pooling](./DEPLOYMENT.md) | [Developer blackbox checks](./DEVELOPER_GUIDE.md#validating-changes-blackbox)

## Database indexes

Migration [`20250614000000_add_bet_performance_indexes`](../apps/api/prisma/migrations/20250614000000_add_bet_performance_indexes/migration.sql) adds:

- `bets(categoryId)` — category filter / `findByCategory`
- `bets(status, created_at DESC)` — status list queries

## Database query audit (Supabase)

Run in the Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

Use **Database → Index Advisor** in the Supabase dashboard on the slowest queries (typically bet list with odds vote counts).

## Connection pooling

Use Supabase transaction pooler for runtime connections:

- `DATABASE_URL` — pooler host, port `6543`, append `?pgbouncer=true`
- `DIRECT_URL` — direct host, port `5432` (migrations only)

Example:

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

## Realtime (Socket.io)

The API pushes events on `/socket.io`:

| Event | Trigger |
|-------|---------|
| `vote:created` | New authenticated stake vote |
| `bet:created` | New bet |
| `bet:updated` | Bet update, close, resolve |
| `bet:resolved` | Payout to winning voter |
| `payment:confirmed` | Pix/instore payment approved |
| `reward:validated` | Admin validates reward ticket |

Payload shapes: [`packages/types/src/realtime.ts`](../packages/types/src/realtime.ts). REST + listener examples: [API.md](./API.md#realtime-api-socketio).

## Caching

| Layer | What | TTL / notes |
|-------|------|-------------|
| Backend `node-cache` | Categories list | 5 min |
| Backend `node-cache` | Resolved bets | 2 min |
| Backend `node-cache` | Single bet detail | 30 s |
| Redis | Leaderboard top 100 | configurable |
| Redis | User dashboard aggregate | per-user keys |
| Redis | Auth token blacklist | until JWT expiry |
| Redis | Ticket PNG cache | configurable |
| Bull + Redis | Bet status job | scheduled transitions |
| Bull + Redis | Analytics refresh | materialized views |
| HTTP `Cache-Control` | `GET /api/v1/categories` | 5 min + SWR 60 s |
| Frontend query cache | Categories | 5 min stale |

List bet DTOs include `totalStake` (parimutuel aggregation). Use `GET /ready` for readiness probes (DB check; 503 on failure).

## Horizontal scaling note

Socket.io broadcasts are in-memory. If Vercel or Render runs multiple API instances, add `@socket.io/redis-adapter` for cross-instance fan-out.

## Blackbox validation checklist

Run against a live stack (`npm run dev` locally or deployed URLs).

### REST

```bash
# Health
curl -s http://localhost:8000/health | jq .

# Slim list DTO (odds without result/createdAt on list)
curl -s 'http://localhost:8000/api/v1/bets?limit=1' | jq '.data.data[0].odds[0]'

# Category cache headers
curl -s -D - http://localhost:8000/api/v1/categories -o /dev/null | grep -i cache-control

# Gzip
curl -s -H 'Accept-Encoding: gzip' -D - \
  'http://localhost:8000/api/v1/bets?limit=50' -o /dev/null | grep -i content-encoding
```

### Socket.io + vote

1. Start a Socket.io listener (see [API.md](./API.md#realtime-api-socketio)).
2. `curl -X POST http://localhost:8000/api/v1/votes -H 'Content-Type: application/json' -H 'Authorization: Bearer <token>' -d '{"oddId": 1, "amount": 10}'`
3. Expect `vote:created` on the listener with updated `totalVotes` and `totalStake`.

### Browser (two clients)

1. Open http://localhost:3002 in two windows.
2. Vote in window A.
3. Window B updates counts without refresh.
4. DevTools: only `POST /votes` after click — no `GET /bets/:id`.

### Regression

```bash
npm run test:api
npm run test:web
```
