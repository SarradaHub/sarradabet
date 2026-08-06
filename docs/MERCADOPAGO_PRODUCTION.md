# Mercado Pago — Production Deployment

Guide for deploying SarradaBet with **real Pix payments** (online + QR presencial) via Mercado Pago in production.

For local sandbox testing, see [Feature 07 — Sandbox testing](./features/07-mercadopago-qr-instore.md#sandbox-testing) and [`LOCAL_WEBHOOKS.md`](./LOCAL_WEBHOOKS.md). For general hosting (Docker, Vercel, Render), see [`DEPLOYMENT.md`](./DEPLOYMENT.md).

---

## Overview

SarradaBet uses two Mercado Pago integrations:

| Flow | UI | MP API | Webhook topic |
|------|-----|--------|---------------|
| **Pix online** | `/coins` → Pix online | Payments API (`POST /v1/payments`) | `payment` |
| **QR presencial** | `/coins` or `/admin/payments` | Orders API (`POST /v1/orders`) | `order` |

Both flows credit coins after the API receives a valid webhook and confirms status with Mercado Pago.

**Production requirements:**

- HTTPS API reachable by Mercado Pago (webhooks)
- **Production credentials** (not test accounts or `TEST-` sandbox tokens)
- `MERCADOPAGO_MOCK_PIX=false` (enforced when `NODE_ENV=production`)
- Valid store/POS IDs for QR presencial (from `mp:setup-store` with production token)

---

## Pre-deployment checklist (Mercado Pago panel)

Complete these in [Suas integrações](https://www.mercadopago.com.br/developers/panel/app) before going live.

### 1. Application & products

- [ ] Application created (e.g. **sarradabet**)
- [ ] **Checkout Transparente** (or Payments API / Pix online) enabled
- [ ] **QR Code / Orders API** enabled for instore flow (if using QR presencial)
- [ ] Integration **homologated** if required by MP for your product mix ([Qualidade da integração](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/quality))

### 2. Production credentials

Open **Credenciais de produção** (not test):

- [ ] **Access Token** (`APP_USR-...`) — copy to deployment secrets
- [ ] **Public Key** — only needed if you add Checkout Bricks on the frontend (SarradaBet server uses Access Token only today)

Docs: [Credenciais](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/credentials)

### 3. Webhooks

Configure in **Suas integrações → Webhooks**:

| Field | Production value |
|-------|------------------|
| **Production URL** | `https://<your-api-host>/api/v1/webhooks/mercadopago` |
| **Topics** | `payment` (Pix online) and `order` (QR presencial) |

Example (Vercel API):

```text
https://sarradabet-api.vercel.app/api/v1/webhooks/mercadopago
```

- [ ] Copy **Webhook secret** → `MERCADOPAGO_WEBHOOK_SECRET`
- [ ] Do **not** use ngrok URLs in production
- [ ] QR Orders API: configure notifications in the panel only ([no per-order `notification_url`](https://www.mercadopago.com.br/developers/pt/docs/qr-code-migration/overview))

Docs: [Notificações](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications)

### 4. Store & POS (QR presencial only)

Run once against **production** credentials (from a secure machine, not CI logs):

```bash
cd apps/api
# Production token in env — never commit
MERCADOPAGO_INSTORE_ACCESS_TOKEN=APP_USR-... \
MERCADOPAGO_MOCK_PIX=false \
npm run mp:setup-store
```

- [ ] Real store address and coordinates (MP tax requirement)
- [ ] Save output: `MERCADOPAGO_STORE_ID`, `MERCADOPAGO_POS_ID`, `MERCADOPAGO_POS_UUID`
- [ ] Re-run is idempotent (same `external_id` values)

Docs: [Criar loja e caixa](https://www.mercadopago.com.br/developers/pt/docs/qr-code/create-store-and-pos)

### 5. CORS & frontend

- [ ] `CORS_ORIGINS` includes your production web origin (required for Socket.io)
- [ ] `VITE_API_URL` on web build = API base URL **without** `/api/v1` suffix

---

## Environment variables (API)

Set these on your production host (Vercel, Render, Docker, etc.). **Never commit production tokens.**

### Required (Pix)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` |
| `MERCADOPAGO_MOCK_PIX` | `false` |
| `MERCADOPAGO_WEBHOOK_SECRET` | From MP panel → Webhooks |
| `MERCADOPAGO_NOTIFICATION_URL` | `https://<api>/api/v1/webhooks/mercadopago` |
| `MERCADOPAGO_PAYMENTS_ACCESS_TOKEN` | Production token for Pix online (Payments API) |
| `MERCADOPAGO_INSTORE_ACCESS_TOKEN` | Production token for QR presencial (Orders API) |
| `CORS_ORIGINS` | Production web URL(s), comma-separated |
| `JWT_SECRET` | Strong random secret |
| `DATABASE_URL` / `DIRECT_URL` | Production Postgres |

If both flows use the **same** production Access Token, you may set only:

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
```

The API resolves `MERCADOPAGO_PAYMENTS_ACCESS_TOKEN` and `MERCADOPAGO_INSTORE_ACCESS_TOKEN` from that fallback.

### Required (QR presencial only)

| Variable | Description |
|----------|-------------|
| `MERCADOPAGO_STORE_ID` | From `mp:setup-store` |
| `MERCADOPAGO_POS_ID` | From `mp:setup-store` |
| `MERCADOPAGO_POS_UUID` | From `mp:setup-store` |
| `MERCADOPAGO_STORE_EXTERNAL_ID` | Default `SARRADABET001` (must match setup) |
| `MERCADOPAGO_POS_EXTERNAL_ID` | Default `SARRADABET001POS001` |

Optional: `MERCADOPAGO_USER_ID`, `MERCADOPAGO_STORE_*` address fields (used at setup time).

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PIX_EXPIRATION_MINUTES` | `30` | Pix QR expiry (min 30 per MP) |
| `MERCADOPAGO_TEST_PAYER_EMAIL` | — | **Do not set in production.** Sandbox-only override. |
| `PUBLIC_WEB_URL` | First `CORS_ORIGINS` entry | Used in ticket/QR metadata |

### Example (Vercel / Render API)

```env
NODE_ENV=production
CORS_ORIGINS=https://sarradabet-web.vercel.app
JWT_SECRET=<strong-secret>
DATABASE_URL=<pooler-url>
DIRECT_URL=<direct-url>

MERCADOPAGO_MOCK_PIX=false
MERCADOPAGO_PAYMENTS_ACCESS_TOKEN=APP_USR-<production>
MERCADOPAGO_INSTORE_ACCESS_TOKEN=APP_USR-<production>
MERCADOPAGO_WEBHOOK_SECRET=<from-mp-panel>
MERCADOPAGO_NOTIFICATION_URL=https://sarradabet-api.vercel.app/api/v1/webhooks/mercadopago

MERCADOPAGO_STORE_ID=<from-setup>
MERCADOPAGO_POS_ID=<from-setup>
MERCADOPAGO_POS_UUID=<from-setup>
PIX_EXPIRATION_MINUTES=30
```

---

## Deployment steps

### 1. Database

```bash
npm run prisma:migrate:deploy
npm run db:seed:simple   # optional; production seed policy may differ
```

Run migrations from CI or a one-off shell with `DATABASE_URL` and `DIRECT_URL` set (see [`DEPLOYMENT.md`](./DEPLOYMENT.md#migrations)).

### 2. API

Deploy `apps/api` with all Mercado Pago env vars above.

**Vercel:** root directory `apps/api`, config in [`apps/api/vercel.json`](../apps/api/vercel.json).

**Verify health:**

```bash
curl -s https://<your-api>/health
```

### 3. Web

Deploy `apps/web` with design-system build (see [`DEPLOYMENT.md`](./DEPLOYMENT.md#web-vercel)).

```env
VITE_API_URL=https://<your-api-host>
```

### 4. Mercado Pago webhook URL

After API is live:

1. Set **Production URL** in MP panel to `https://<api>/api/v1/webhooks/mercadopago`
2. Enable topics **`payment`** and **`order`**
3. Save **Webhook secret** in API env (must match)

### 5. Validate configuration

From a machine with production env loaded (or use panel test notification):

```bash
cd apps/api
npm run mp:validate-live -- --ping
```

Expect: payments + instore tokens OK, HTTPS notification URL, instore store/POS IDs, `/users/me` success.

---

## Post-deploy verification

### Smoke test — Pix online

1. Open production web app → login as a real user
2. **Moedas** → **Pix online** → buy smallest package
3. Pay with **real Pix** (any bank app or Mercado Pago)
4. Confirm:
   - [ ] API log: `POST /api/v1/webhooks/mercadopago` → 200
   - [ ] Coin balance increases
   - [ ] `PixPayment` status `APPROVED` in DB or admin monitor

### Smoke test — QR presencial (optional)

1. **Moedas** → **QR presencial** or **Admin → Pagamentos → Caixa QR**
2. Customer scans QR and pays with Pix
3. Confirm `order` webhook and coin credit

### Admin monitor

`/admin/payments` → **Monitoramento** — filter by status/channel.

---

## Production vs local (quick reference)

| Topic | Local (sandbox) | Production |
|-------|-----------------|------------|
| Credentials | Test (`TEST-` / test `APP_USR-`) | **Credenciais de produção** |
| Webhook URL | ngrok (`LOCAL_WEBHOOKS.md`) | Public HTTPS API URL |
| Payer | Test buyer accounts | Real users / real Pix |
| `MERCADOPAGO_MOCK_PIX` | `true` or `false` | **Must be `false`** |
| Simulate approval | Available when mock | **Disabled** |
| Collector on ticket | May show integrator name in sandbox | Your production MP account |

---

## Security checklist

- [ ] Production tokens only in host secrets (Vercel/Render), never in git
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` set; webhook handler rejects invalid signatures
- [ ] `MERCADOPAGO_MOCK_PIX=false`
- [ ] HTTPS everywhere (API + webhook URL)
- [ ] `CORS_ORIGINS` restricted to your web domain(s)
- [ ] Rotate tokens if leaked (regenerate in MP panel, update env, redeploy)
- [ ] Admin routes protected by JWT + admin role
- [ ] Monitor failed webhooks in MP panel and API logs

---

## Troubleshooting

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Pix created but coins never credit | Webhook not reaching API | Check MP panel URL, secret, API logs; test with panel “Simular” |
| `Invalid webhook signature` | Secret mismatch | Sync `MERCADOPAGO_WEBHOOK_SECRET` with panel |
| `502` on Pix create | Invalid/expired token | Verify production Access Token; run `mp:validate-live --ping` |
| QR presencial 400 | Missing store/POS | Run `mp:setup-store` with production token; set `STORE_ID` / `POS_ID` / `POS_UUID` |
| Socket.io disconnects | CORS | Add web origin to `CORS_ORIGINS` |
| Mock simulate in prod | `MERCADOPAGO_MOCK_PIX=true` | API refuses to start in production — set `false` |

---

## Related documentation

| Doc | Topic |
|-----|--------|
| [Feature 02 — Coins & Pix](./features/02-coins-and-pix-payments.md) | Online Pix flow, env vars |
| [Feature 07 — QR Instore](./features/07-mercadopago-qr-instore.md) | Store/POS setup, sandbox testing |
| [API.md](./API.md) | REST + webhook payloads |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel, Render, Docker |
| [LOCAL_WEBHOOKS.md](./LOCAL_WEBHOOKS.md) | ngrok (development only) |
| [PERFORMANCE.md](./PERFORMANCE.md) | Multi-instance Socket.io (Redis) |

### Mercado Pago official links

- [Credenciais de produção](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/credentials)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications)
- [Integrar Pix (Checkout API)](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/integration-configuration/integrate-with-pix)
- [QR Code — criar loja e caixa](https://www.mercadopago.com.br/developers/pt/docs/qr-code/create-store-and-pos)
- [QR — notificações (`order`)](https://www.mercadopago.com.br/developers/pt/docs/qr-code/notifications)

---

## Rollback

If a deployment breaks payments:

1. **Redeploy** previous API version (Vercel/Render rollback)
2. **Do not** change webhook URL unless API host changed
3. Pending Pix payments may still complete via webhook to the URL active at payment time
4. Verify MP panel credentials were not rotated mid-incident

For application rollback procedures, see [`DEPLOYMENT.md` — Rollback](./DEPLOYMENT.md#rollback-procedures).
