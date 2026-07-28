# Local Mercado Pago webhooks (ngrok)

Use this flow to test **real Pix QR codes** locally. Mercado Pago must reach your API over HTTPS to confirm payments and credit coins.

## Prerequisites

- API running on port `8000` (`npm run dev` in `apps/api`)
- Test credentials in `apps/api/.env` or `.env.local`
- [ngrok account](https://dashboard.ngrok.com/signup) (free tier works)

## 1. Install ngrok

**Linux / WSL:**

```bash
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
  | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \
  && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" \
  | sudo tee /etc/apt/sources.list.d/ngrok.list \
  && sudo apt update && sudo apt install ngrok
```

Or download from [ngrok.com/download](https://ngrok.com/download).

**WSL + snap:** if you see `ngrok is available in '/snap/bin/ngrok'` but `command not found`, add snap to PATH:

```bash
echo 'export PATH="/snap/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Or use the repo helper (finds `/snap/bin/ngrok` automatically):

```bash
cd apps/api
npm run webhook:tunnel
```

## 2. Authenticate ngrok (once)

1. Sign up: [dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup)
2. Copy authtoken: [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
3. Register it:

```bash
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN
```

Alternative — put it in `apps/api/.env.local`:

```env
NGROK_AUTHTOKEN=YOUR_NGROK_AUTHTOKEN
```

Then run `npm run webhook:tunnel` again.

## 3. Start three terminals

**Terminal A — API**

```bash
cd apps/api
npm run dev
```

**Terminal B — ngrok tunnel**

```bash
ngrok http 8000
```

Copy the `https://....ngrok-free.app` URL (HTTPS, not HTTP).

**Terminal C — configure env + MP webhook**

```bash
cd apps/api
npm run webhook:configure
```

This script:

1. Reads the active ngrok URL from `http://127.0.0.1:4040/api/tunnels`
2. Writes `apps/api/.env.local`:
   - `MERCADOPAGO_NOTIFICATION_URL=https://<ngrok>/api/v1/webhooks/mercadopago`
   - `MERCADOPAGO_MOCK_PIX=false`
3. Attempts to sync the same URL to Mercado Pago (sandbox + production fields)

Manual URL override:

```bash
npm run webhook:configure -- --url=https://your-subdomain.ngrok-free.app
```

Skip Mercado Pago panel sync:

```bash
npm run webhook:configure -- --no-sync
```

## 4. Restart the API

`.env.local` is loaded at startup. Stop and start Terminal A after `webhook:configure`.

## 5. Test real Pix

1. Open the web app → Coins → buy a package
2. Confirm copia-e-cola **does not** contain `mock`
3. Pay with a Mercado Pago **test buyer** account
4. Watch API logs for `POST /api/v1/webhooks/mercadopago`
5. Coins should credit; UI updates via polling / Socket.io

## Required env vars

| Variable | Purpose |
|----------|---------|
| `MERCADOPAGO_ACCESS_TOKEN` | Test token (`APP_USR-...`) |
| `MERCADOPAGO_WEBHOOK_SECRET` | Signature secret from MP panel → Webhooks |
| `MERCADOPAGO_NOTIFICATION_URL` | ngrok HTTPS URL (set by `webhook:configure`) |
| `MERCADOPAGO_MOCK_PIX=false` | Use real Mercado Pago Payment API |

Keep secrets in `.env.local` (gitignored).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `webhook:configure` can't find ngrok URL | Start `ngrok http 8000` first |
| Payment stays pending | ngrok stopped or URL changed — re-run `webhook:configure` and restart API |
| `Invalid webhook signature` | `MERCADOPAGO_WEBHOOK_SECRET` must match MP panel secret |
| QR still shows `mock` | Old payment — create a **new** Pix after disabling mock |
| ngrok URL changed | ngrok free URLs change each session — re-run configure every time |

## Mercado Pago panel (manual fallback)

**Suas integrações → sarradabet → Webhooks**

- Test URL: `https://<ngrok>/api/v1/webhooks/mercadopago`
- Topics: `payment` (required for Pix coin purchases)

## Related docs

- [Feature 02 — Coins & Pix](./features/02-coins-and-pix-payments.md)
- [Feature 07 — QR instore setup](./features/07-mercadopago-qr-instore.md)
