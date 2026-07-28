# Feature 02 — Coin Economy and Pix Payments

**Status:** Complete (online Pix). Local **real MP** testing documented; instore QR is Feature 07.

## Prompt summary

Implement the coin economy: add coin balance to users, a service to credit/debit coins with atomic transactions and a transaction history table (`coin_transactions`). Build the Pix purchase flow: endpoint to request a purchase (generates QR code with fixed package value), gateway integration (Efí or Mercado Pago), webhook for payment confirmation with signature validation. On confirmation, credit coins and notify the user via Socket.io. Handle expiration and idempotency.

## Handoff for next agent

### What works today

| Area | Status |
|------|--------|
| Coin balance, ledger, packages | Done |
| Online Pix via MP **Payment API** | Done |
| Mock Pix (`MERCADOPAGO_MOCK_PIX=true`) | Done — simulate approval endpoint |
| Webhook HMAC + coin credit + Socket.io | Done |
| Frontend Coins page + QR display | Done |
| MP test credentials in `apps/api/.env` | Configured (app `sarradabet`, id `7716487240713931`) |
| Instore store/POS (step 2) | Done — see [Feature 07](./07-mercadopago-qr-instore.md) |

### What the user was doing (Jul 2026)

1. Configure Mercado Pago integration (application → store/POS → **real Pix testing**).
2. Hit mock Pix (red square QR, `mock_` in copia-e-cola) → fixed with `MERCADOPAGO_MOCK_PIX=false` + `PixQrCode` component.
3. Set up **ngrok** for local webhooks — see [`docs/LOCAL_WEBHOOKS.md`](../LOCAL_WEBHOOKS.md).
4. Login timeout on WSL → fixed by using **Vite proxy** in dev (see [Local dev networking](#local-dev-networking-wsl)).

### Likely next steps

1. Finish ngrok auth + run `npm run webhook:tunnel` → `npm run webhook:configure` → restart API → **new** Pix purchase.
2. Pay with MP **test buyer**; confirm webhook hits local API and coins credit.
3. Optionally wire **Feature 03** `BET_COST` debit on vote.
4. Instore QR **payment processing** (`POST /v1/orders`) — Feature 07 step 3, not this doc.

### Do not confuse

| Flow | API | Used on Coins page? |
|------|-----|---------------------|
| **Online Pix** (this feature) | MP `Payment` API | Yes |
| **Instore QR** (Feature 07) | MP Stores/POS + Orders API | No (not wired yet) |

Store/POS IDs in env are for future instore orders, not for current coin Pix purchases.

---

## Mercado Pago issues (handled & open)

Issues encountered while integrating MP. Use this when debugging or continuing with another agent.

### Handled in codebase

| # | Symptom | Cause | Fix |
|---|---------|-------|-----|
| 1 | `mp:setup-store` — missing instore env vars | Store/POS fields not in `.env` | Defaults in [`env.ts`](../../apps/api/src/config/env.ts); optional overrides in `.env` |
| 2 | Setup script rejects token | Placeholder `your_mercadopago_test_access_token` | Early check in [`setupMercadoPagoStore.ts`](../../apps/api/scripts/setupMercadoPagoStore.ts); put real token in `.env` / `.env.local` |
| 3 | Setup re-creates store → duplicate `external_id` | Store search parsed wrong response shape | [`MercadoPagoInstoreClient`](../../apps/api/src/modules/payment/services/MercadoPagoInstoreClient.ts) reads `results[]`, not root `id` |
| 4 | `create store failed: location.state_name was invalid` | `Sao Paulo` without accent | Defaults use `São Paulo` for city + state |
| 5 | `create pos failed: External store id does not refer any store` | Follow-on from #3 — store not found before POS create | Fixed by #3; idempotent re-run works |
| 6 | `uuid=n/a` on setup re-run; missing `MERCADOPAGO_POS_UUID` in output | POS list search omits `uuid` | `getPosById` + `hydratePosDetails`; fallback parse from QR image URL |
| 7 | QR shows red square | Mock client returned 1×1 PNG base64 | [`MockMercadoPagoClient`](../../apps/api/src/modules/payment/services/MockMercadoPagoClient.ts) generates real QR via `qrcode`; [`PixQrCode.tsx`](../../apps/web/src/components/PixQrCode.tsx) regenerates from copia-e-cola when mock |
| 8 | Copia-e-cola contains `mock_` / `6304MOCK` | `MERCADOPAGO_MOCK_PIX=true` | Set `MERCADOPAGO_MOCK_PIX=false` + real token; create **new** payment (old rows stay mock) |
| 9 | Pix paid but coins never credit locally | `MERCADOPAGO_NOTIFICATION_URL` pointed to Vercel; local API never got webhook | ngrok tunnel + [`webhook:configure`](../../apps/api/scripts/configureWebhookTunnel.ts) → `.env.local` |
| 10 | `ngrok: command not found` (snap) | `/snap/bin` not in PATH | `~/.zshrc` + [`runNgrok.sh`](../../apps/api/scripts/runNgrok.sh) resolves `/snap/bin/ngrok` |
| 11 | Login `timeout of 10000ms exceeded` | Browser on Windows/WSL called `localhost:8000` directly | Dev uses Vite proxy — unset `VITE_API_URL` in [`apps/web/.env`](../../apps/web/.env); open `localhost:3002` |
| 12 | **Entrar** button disappeared | Nav hid auth buttons while `status === "loading"` | [`Navigation.tsx`](../../apps/web/src/components/Navigation.tsx) shows Entrar when not authenticated; refresh timeout 10s |
| 13 | Payment stuck pending (no webhook yet) | Frontend only polled DB, not MP | [`PixPaymentService.getPaymentStatus`](../../apps/api/src/modules/payment/services/PixPaymentService.ts) calls MP `getPayment` when PENDING (non-mock) |

### Open / user action required

| # | Symptom | What to do |
|---|---------|------------|
| A | `ERR_NGROK_4018` / not authenticated | `ngrok config add-authtoken YOUR_TOKEN` — see [`LOCAL_WEBHOOKS.md`](../LOCAL_WEBHOOKS.md) |
| B | `webhook:configure` can't find ngrok URL | Start `npm run webhook:tunnel` first; URL changes each session → re-run configure + restart API |
| C | MP panel webhook sync fails in script | Manual: **Suas integrações → sarradabet → Webhooks** → test URL `https://<ngrok>/api/v1/webhooks/mercadopago`, topic `payment` |
| D | Real Pix E2E not verified end-to-end | Complete ngrok flow; pay with MP **test buyer**; watch for `POST /webhooks/mercadopago` in API logs |
| E | Confusion: online Pix vs instore QR | Coins page = **Payment API** only. Store/POS = Feature 07 step 3 (`POST /v1/orders`) — not wired to coin purchase yet |

### MP app context (test)

| Item | Value |
|------|--------|
| Application name | `sarradabet` |
| Application ID | `7716487240713931` |
| Test seller `user_id` | `3555274944` |
| Store `id` / `external_id` | `85026096` / `SARRADABET001` |
| POS `id` / `external_id` | `135594016` / `SARRADABET001POS001` |

Credentials live in gitignored `apps/api/.env` / `.env.local` — do not commit tokens.

### Related docs for MP issues

| Issue area | Doc |
|------------|-----|
| ngrok + local webhooks | [`LOCAL_WEBHOOKS.md`](../LOCAL_WEBHOOKS.md) |
| Store/POS setup (step 2) | [`07-mercadopago-qr-instore.md`](./07-mercadopago-qr-instore.md) |
| Dev env / WSL | [`DEVELOPER_GUIDE.md`](../DEVELOPER_GUIDE.md) |

---

## Current state in SarradaBet

### Database

| Model | Purpose |
|-------|---------|
| `CoinPackage` | Purchasable packages (`amountCents`, `coinsAmount`, `isActive`) |
| `CoinTransaction` | Ledger with `type`, `amount`, `balanceAfter`, `source`, `externalId` |
| `PixPayment` | Pix intent with QR data, `expiresAt`, `idempotencyKey`, `externalId` |

Enums in [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma):

- `CoinTransactionSource`: `PIX_PURCHASE`, `BET_COST`, `ADMIN_ADJUSTMENT`, `REFUND`
- `PixPaymentStatus`: `PENDING`, `APPROVED`, `EXPIRED`, `CANCELLED`, `FAILED`

### Backend services

| Component | Path |
|-----------|------|
| Coin credit/debit (atomic) | [`CoinService.ts`](../../apps/api/src/modules/coin/services/CoinService.ts) |
| Coin repository | [`CoinRepository.ts`](../../apps/api/src/modules/coin/repositories/CoinRepository.ts) |
| Pix purchase + webhook confirm | [`PixPaymentService.ts`](../../apps/api/src/modules/payment/services/PixPaymentService.ts) |
| Mercado Pago Payment API client | [`MercadoPagoClient.ts`](../../apps/api/src/modules/payment/services/MercadoPagoClient.ts) |
| Mock gateway (local dev) | [`MockMercadoPagoClient.ts`](../../apps/api/src/modules/payment/services/MockMercadoPagoClient.ts) |
| Gateway selection | [`payment.container.ts`](../../apps/api/src/modules/payment/payment.container.ts) |
| Webhook route | [`webhook.routes.ts`](../../apps/api/src/routes/webhook.routes.ts) |
| Webhook signature middleware | [`mercadopagoWebhook.ts`](../../apps/api/src/core/middleware/mercadopagoWebhook.ts) |
| Admin coin packages CRUD | [`admin.coin-package.routes.ts`](../../apps/api/src/routes/admin.coin-package.routes.ts) |

### Gateway modes

| Mode | Env | Behavior |
|------|-----|----------|
| **Mock** | `MERCADOPAGO_MOCK_PIX=true` | Fake Pix string (`mock_`, `6304MOCK`); `POST /payments/pix/:id/simulate-approval`; QR rendered from copia-e-cola via `qrcode` lib |
| **Real** | `MERCADOPAGO_MOCK_PIX=false` + `MERCADOPAGO_ACCESS_TOKEN` | MP Payment API; real QR; confirm via webhook + poll |

Mock is **blocked in production** (`env.ts`).

### Environment variables

From [`apps/api/src/config/env.ts`](../../apps/api/src/config/env.ts) and [`apps/api/.env.example`](../../apps/api/.env.example):

| Variable | Purpose |
|----------|---------|
| `MERCADOPAGO_ACCESS_TOKEN` | MP API auth (test: `APP_USR-...`) |
| `MERCADOPAGO_WEBHOOK_SECRET` | HMAC webhook validation (MP panel → Webhooks) |
| `MERCADOPAGO_NOTIFICATION_URL` | Sent on each Pix create; **must be HTTPS** for real MP |
| `MERCADOPAGO_MOCK_PIX` | `true` = mock gateway; `false` = real MP |
| `PIX_EXPIRATION_MINUTES` | QR validity (min 30, MP limit) |
| `MERCADOPAGO_USER_ID` | Optional; test seller id |

Secrets and ngrok URL overrides: `apps/api/.env.local` (gitignored, loaded with override).

**Instore vars** (`MERCADOPAGO_STORE_ID`, `MERCADOPAGO_POS_ID`, etc.) — provisioned via `npm run mp:setup-store`; see Feature 07, not used by online Pix yet.

### API routes

| Method | Route | Auth |
|--------|-------|------|
| GET | `/api/v1/coins/packages` | Public |
| GET | `/api/v1/coins/balance` | User |
| GET | `/api/v1/coins/transactions` | User |
| POST | `/api/v1/payments/pix` | User |
| GET | `/api/v1/payments/pix/:id` | User |
| POST | `/api/v1/payments/pix/:id/simulate-approval` | User (mock only) |
| POST | `/api/v1/webhooks/mercadopago` | Webhook HMAC |
| CRUD | `/api/v1/admin/coin-packages` | Admin |

Documented in [`docs/API.md`](../API.md).

### NPM scripts (API)

| Script | Purpose |
|--------|---------|
| `npm run mp:setup-store` | Create/find MP store + POS (Feature 07 step 2) |
| `npm run webhook:configure` | Set `MERCADOPAGO_NOTIFICATION_URL` from ngrok → `.env.local` |
| `npm run webhook:tunnel` | Start ngrok on port 8000 (`scripts/runNgrok.sh`) |

### Frontend

| Component | Path |
|-----------|------|
| Coins page | [`CoinsPage.tsx`](../../apps/web/src/pages/CoinsPage.tsx) |
| QR rendering (mock + real) | [`PixQrCode.tsx`](../../apps/web/src/components/PixQrCode.tsx) |
| Hooks | `usePixPurchase`, `useCoinBalance`, `useCoinTransactions` |
| Admin packages | [`AdminCoinPackagesPage.tsx`](../../apps/web/src/pages/AdminCoinPackagesPage.tsx) |
| API client (Vite proxy in dev) | [`apiClient.ts`](../../apps/web/src/services/apiClient.ts) |

Requires login (`ProtectedRoute` on `/coins`). Nav: **Entrar** when guest.

### Shared types

- [`packages/types/src/coin.ts`](../../packages/types/src/coin.ts)
- [`packages/types/src/payment.ts`](../../packages/types/src/payment.ts) — includes `isMock?: boolean`
- Realtime: `payment:confirmed` in [`packages/types/src/realtime.ts`](../../packages/types/src/realtime.ts)

### Tests

| File | Coverage |
|------|----------|
| [`coin.service.test.ts`](../../apps/api/src/__tests__/unit/coin.service.test.ts) | Credit/debit, idempotency |
| [`pixPayment.service.test.ts`](../../apps/api/src/__tests__/unit/pixPayment.service.test.ts) | Confirm, webhook idempotency |
| [`mercadopagoWebhook.test.ts`](../../apps/api/src/__tests__/unit/mercadopagoWebhook.test.ts) | Signature validation |
| [`mercadopagoInstoreClient.test.ts`](../../apps/api/src/__tests__/unit/mercadopagoInstoreClient.test.ts) | Store/POS client (Feature 07) |
| [`payment.routes.test.ts`](../../apps/api/src/__tests__/integration/payment.routes.test.ts) | POST /pix, GET status |
| [`pix-expiration.test.ts`](../../apps/api/src/__tests__/integration/pix-expiration.test.ts) | Expiration job |

Run: `npm run test --workspace=apps/api -- coin pix payment`

---

## Pix purchase flow (online)

```mermaid
sequenceDiagram
  participant User
  participant Web
  participant API
  participant MP as MercadoPago_Payment_API
  participant DB

  User->>Web: POST /payments/pix (via auth)
  Web->>API: POST /api/v1/payments/pix
  API->>MP: Create Pix payment
  API->>DB: Insert PixPayment PENDING
  API-->>Web: qrCodeBase64, copyPaste, expiresAt

  MP->>API: POST /webhooks/mercadopago (HTTPS)
  API->>API: Validate HMAC
  API->>DB: APPROVED + creditCoins
  API->>Web: Socket.io payment:confirmed

  Note over Web,API: GET /payments/pix/:id polls every 5s;<br/>also calls MP getPayment when PENDING (non-mock)
```

---

## Local dev: real Pix + webhooks

Mercado Pago cannot POST to `http://localhost:8000`. Use **ngrok**.

**Full guide:** [`docs/LOCAL_WEBHOOKS.md`](../LOCAL_WEBHOOKS.md)

**Quick checklist:**

```bash
# Terminal 1 — API + web (from repo root)
npm run dev

# Terminal 2 — ngrok (authenticate once: ngrok config add-authtoken ...)
cd apps/api && npm run webhook:tunnel

# Terminal 3 — write .env.local
cd apps/api && npm run webhook:configure

# Restart API, then Coins → NEW Pix purchase (old mock payments invalid)
```

**WSL + snap:** add `/snap/bin` to PATH (`~/.zshrc` already updated in session).

**Verify real Pix:** copia-e-cola must **not** contain `mock` or `6304MOCK`.

---

## Local dev networking (WSL)

| Issue | Cause | Fix |
|-------|-------|-----|
| Login `timeout of 10000ms exceeded` | Browser called `http://localhost:8000` directly; WSL port not reachable from Windows | Dev uses **Vite proxy**: leave `VITE_API_URL` unset in [`apps/web/.env`](../../apps/web/.env); requests go to `/api/...` on port **3002** |
| Entrar button missing | Auth stuck on `loading` while refresh hung | Fixed: show Entrar when not authenticated; refresh timeout 10s |

Open app at **`http://localhost:3002`** (Vite default). Production builds still need `VITE_API_URL` at build time.

---

## Gaps vs prompt

- **`BET_COST` not wired** — enum exists; debit on vote/bet is Feature 03
- **Efí Bank** — not implemented; Mercado Pago is production path
- **Fixed-value QR** — implemented via `CoinPackage` tiers
- **Local webhook without ngrok** — not supported; MP requires HTTPS
- **Instore QR coin purchase** — not started (Feature 07 step 3)

## Related docs

| Doc | Topic |
|-----|--------|
| [LOCAL_WEBHOOKS.md](../LOCAL_WEBHOOKS.md) | ngrok, `webhook:configure`, test buyer |
| [07-mercadopago-qr-instore.md](./07-mercadopago-qr-instore.md) | Store/POS setup, Orders API (future) |
| [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) | Env files, dev setup |
| [API.md](../API.md) | REST + webhook contract |

## Recommended technical references

| Topic | Reference |
|-------|-----------|
| Mercado Pago Pix (online) | [Payment API / Node SDK](https://www.mercadopago.com.br/developers/pt/docs/sdks-library/nodejs) |
| Webhooks | [MP Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks) |
| Instore QR | [Create store and POS](https://www.mercadopago.com.br/developers/pt/docs/qr-code/create-store-and-pos) |
| Efí (alternative) | [Efí Pay API](https://dev.efipay.com.br/) |
| Atomicity | Prisma `$transaction` in `CoinService` |
| Idempotency | `externalId` on `CoinTransaction`; webhook replay safe |

## Implementation checklist

### Backend

- [x] `CoinService.creditCoins` / `debitCoins` with `$transaction`
- [x] Idempotent credit via `externalId`
- [x] Pix purchase creates QR + stores `PixPayment`
- [x] Webhook validates signature and credits coins
- [x] Socket.io notification on confirm
- [x] Mock gateway + simulate-approval route
- [x] Poll MP on `GET /payments/pix/:id` when PENDING (non-mock)
- [x] Expiration job for stale `PENDING` payments
- [ ] Wire `BET_COST` debit (Feature 03)

### Frontend

- [x] Coins page with package selection and QR display
- [x] `PixQrCode` — renders real QR from copia-e-cola when mock/legacy 1×1 PNG
- [x] Balance and transaction history on CoinsPage
- [x] Listen for `payment:confirmed` to refresh balance
- [x] Mock simulate-approval UI when `isMock`
- [x] Dev Vite proxy for API (WSL-friendly)
- [ ] Transaction history on user dashboard (Feature 05)

### Admin

- [x] CRUD coin packages

### Local real-MP testing (operational)

- [x] Docs + scripts for ngrok webhook tunnel
- [ ] User completes: ngrok authtoken → tunnel → configure → end-to-end Pix pay

## Key files

| Path | Role |
|------|------|
| [`PixPaymentService.ts`](../../apps/api/src/modules/payment/services/PixPaymentService.ts) | Purchase, confirm, poll MP, mock simulate |
| [`MercadoPagoClient.ts`](../../apps/api/src/modules/payment/services/MercadoPagoClient.ts) | Real MP Payment API |
| [`MockMercadoPagoClient.ts`](../../apps/api/src/modules/payment/services/MockMercadoPagoClient.ts) | Local mock Pix + QR generation |
| [`PixQrCode.tsx`](../../apps/web/src/components/PixQrCode.tsx) | Frontend QR display |
| [`configureWebhookTunnel.ts`](../../apps/api/scripts/configureWebhookTunnel.ts) | ngrok → `.env.local` |
| [`LOCAL_WEBHOOKS.md`](../LOCAL_WEBHOOKS.md) | Local webhook runbook |

## Acceptance criteria

- [x] Authenticated user can purchase a package; receives QR code and expiry time
- [x] Duplicate webhook delivery does not double-credit
- [x] Invalid webhook signature rejected
- [x] On approval, balance increases and `payment:confirmed` fires
- [x] Expired payments become `EXPIRED`
- [x] Transaction history shows `PIX_PURCHASE` entries
- [ ] Real test Pix paid locally with ngrok webhook (user verification pending)

## Dependencies

- [Feature 01 — User auth](./01-user-auth-and-crud.md) — Pix routes require authenticated user
- [Feature 07 — MP QR instore](./07-mercadopago-qr-instore.md) — separate instore path; shares MP credentials

## Test plan

```bash
npm run test --workspace=apps/api -- coin pix payment mercadopago
```

Manual: see [LOCAL_WEBHOOKS.md](../LOCAL_WEBHOOKS.md) for real Pix E2E.
