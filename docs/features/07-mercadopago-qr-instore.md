# Feature 07 — Mercado Pago QR Instore (Loja e Caixa)

**Status:** Step 2 complete (store + POS provisioning)

## Prompt summary

Configure Mercado Pago in-person QR integration step 2: create a **loja** (store) and **caixa** (POS) via MP APIs. This is required for the QR presencial flow (`POST /v1/orders`) and runs **alongside** the existing online Pix coin purchase flow (`Payment` API).

## Current state in SarradaBet

### Online Pix (unchanged)

| Component | Path |
|-----------|------|
| Pix purchase + webhook | [`PixPaymentService.ts`](../../apps/api/src/modules/payment/services/PixPaymentService.ts) |
| Payment API client | [`MercadoPagoClient.ts`](../../apps/api/src/modules/payment/services/MercadoPagoClient.ts) |

Online Pix does **not** use store/POS IDs.

### Instore QR (step 2)

| Component | Path |
|-----------|------|
| Instore REST client | [`MercadoPagoInstoreClient.ts`](../../apps/api/src/modules/payment/services/MercadoPagoInstoreClient.ts) |
| Setup/runtime env helpers | [`instoreConfig.ts`](../../apps/api/src/modules/payment/instoreConfig.ts) |
| Instore types | [`types/instore.ts`](../../apps/api/src/modules/payment/types/instore.ts) |
| Setup script | [`scripts/setupMercadoPagoStore.ts`](../../apps/api/scripts/setupMercadoPagoStore.ts) |

### Environment variables

From [`apps/api/src/config/env.ts`](../../apps/api/src/config/env.ts) and [`apps/api/.env.example`](../../apps/api/.env.example):

| Variable | Purpose |
|----------|---------|
| `MERCADOPAGO_ACCESS_TOKEN` | API auth (test or production) |
| `MERCADOPAGO_USER_ID` | Optional override; resolved via `GET /users/me` if omitted |
| `MERCADOPAGO_STORE_EXTERNAL_ID` | Idempotent store key (default `SARRADABET001`) |
| `MERCADOPAGO_STORE_NAME` | Store display name |
| `MERCADOPAGO_STORE_STREET_*`, `CITY_NAME`, `STATE_NAME` | Store address |
| `MERCADOPAGO_STORE_LATITUDE`, `MERCADOPAGO_STORE_LONGITUDE` | Real geo coordinates (MP tax requirement) |
| `MERCADOPAGO_STORE_REFERENCE` | Optional location reference |
| `MERCADOPAGO_POS_EXTERNAL_ID` | Idempotent POS key (default `SARRADABET001POS001`) |
| `MERCADOPAGO_POS_NAME` | POS display name |
| `MERCADOPAGO_POS_CATEGORY` | Optional MCC category |
| `MERCADOPAGO_STORE_ID` | MP store id (output of setup) |
| `MERCADOPAGO_POS_ID` | MP POS id (output of setup) |
| `MERCADOPAGO_POS_UUID` | Static QR identifier (output of setup) |

## Setup procedure

### 1. Prerequisites (Mercado Pago panel)

From **Suas integrações > Dados da integração > Credenciais de teste**:

- Access Token (`APP_USR-...`)
- Optional: test `user_id` (script can resolve automatically)

Use **real** address and latitude/longitude for Brazil. Incorrect location data can break tax calculations.

### 2. Configure `.env`

Copy [`apps/api/.env.example`](../../apps/api/.env.example) to `apps/api/.env`.

Put the **real test Access Token** in `apps/api/.env.local` (gitignored):

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_MOCK_PIX=false
```

`.env.local` overrides `.env`. Do not commit tokens to `.env`.

### 3. Run setup script

```bash
cd apps/api
npm run mp:setup-store
```

The script:

1. Resolves `user_id` from env or `GET /users/me`
2. Finds or creates store via `POST /users/{user_id}/stores`
3. Finds or creates POS via `POST /pos` with `fixed_amount: true`
4. Prints `.env` block with `MERCADOPAGO_STORE_ID`, `MERCADOPAGO_POS_ID`, `MERCADOPAGO_POS_UUID`

Re-running with the same `external_id` values is safe (idempotent lookup before create).

## Gaps vs full QR instore integration

| Area | Status |
|------|--------|
| Create store | Done (script + client) |
| Create POS | Done (script + client) |
| `POST /v1/orders` payment processing | Planned (step 3) |
| Instore order webhooks | Planned |
| Frontend QR presencial UI | Planned |

## Implementation checklist

- [x] `MercadoPagoInstoreClient` with store/POS create + search
- [x] Env schema for setup + runtime IDs
- [x] Idempotent `mp:setup-store` script
- [x] `getMercadoPagoInstoreRuntimeConfig()` for step 3 consumers
- [ ] QR order creation service
- [ ] Webhook handling for instore orders
- [ ] UI for presencial QR payments

## Key files

| File | Role |
|------|------|
| `MercadoPagoInstoreClient.ts` | REST calls to MP stores/POS APIs |
| `instoreConfig.ts` | Validates setup/runtime env groups |
| `setupMercadoPagoStore.ts` | One-time provisioning CLI |
| `mercadopagoInstoreClient.test.ts` | Unit tests with mocked axios |

## Acceptance criteria

- [x] Script creates store + POS with test credentials
- [x] Re-run returns same IDs without duplicate errors
- [x] Online Pix flow unchanged
- [x] Runtime helper fails clearly when step 3 env IDs missing

## Dependencies

- Feature 02 (online Pix) — shared `MERCADOPAGO_ACCESS_TOKEN`
- Mercado Pago QR Code integration docs (step 1 application, step 2 store/POS)

## Test plan

```bash
cd apps/api
npm run test:unit -- mercadopagoInstoreClient
```

Manual: run `npm run mp:setup-store` with test token and verify MP panel shows store/POS.

## Related documentation

- [Feature 02 — Coins & Pix](./02-coins-and-pix-payments.md)
- [Deployment](../DEPLOYMENT.md) — production env vars
- [Mercado Pago — Criar loja e caixa](https://www.mercadopago.com.br/developers/pt/docs/qr-code/create-store-and-pos)
