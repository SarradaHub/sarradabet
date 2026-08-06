# Feature 07 — Mercado Pago QR Instore (Loja e Caixa)

**Status:** Fully Done (orders API + webhooks + UI + admin caixa/monitor + tests + live setup validation)

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
| `MERCADOPAGO_PAYMENTS_ACCESS_TOKEN` | Payments API (Pix online). Usually `TEST-...` from Checkout Transparente |
| `MERCADOPAGO_INSTORE_ACCESS_TOKEN` | Orders API (QR presencial). Usually `APP_USR-...` from QR test credentials |
| `MERCADOPAGO_ACCESS_TOKEN` | Fallback when the specific tokens above are unset |
| `MERCADOPAGO_TEST_PAYER_EMAIL` | Optional override for Payments API `payer.email` (advanced; see [Sandbox testing](#sandbox-testing)) |
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

Put tokens in `apps/api/.env.local` (gitignored):

```env
MERCADOPAGO_PAYMENTS_ACCESS_TOKEN=TEST-...    # Pix online (Checkout/Payments API)
MERCADOPAGO_INSTORE_ACCESS_TOKEN=APP_USR-...   # QR presencial (Orders API)
MERCADOPAGO_MOCK_PIX=false
```

If only one token is configured, set `MERCADOPAGO_ACCESS_TOKEN` as fallback. See [Sandbox testing](#sandbox-testing) for why two tokens are often required locally.

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
| `POST /v1/orders` payment processing | Done — [`InstorePaymentService`](../../apps/api/src/modules/payment/services/InstorePaymentService.ts) |
| Instore order webhooks | Done — `order` / `merchant_order` topic in [`webhook.routes.ts`](../../apps/api/src/routes/webhook.routes.ts) |
| Frontend QR presencial UI | Done — QR presencial tab on [`CoinsPage.tsx`](../../apps/web/src/pages/CoinsPage.tsx) |
| Admin caixa + payment monitor | Done — [`AdminPaymentsPage.tsx`](../../apps/web/src/pages/AdminPaymentsPage.tsx) at `/admin/payments` |
| Admin payment API | Done — [`admin.payment.routes.ts`](../../apps/api/src/routes/admin.payment.routes.ts) |
| Executable tests (unit/integration/E2E) | Done — see [Test plan](#test-plan) |
| Live MP setup validation | Done — `npm run mp:validate-live -- --ping` |

## Gherkin Specifications (BDD)

Os seguintes cenários Gherkin definem o comportamento esperado para o provisionamento da loja e do ponto de venda (POS) via APIs do Mercado Pago, bem como a integração com o fluxo existente de Pix online. Eles devem ser implementados como testes de integração ou E2E executáveis usando Playwright + Cucumber.

```gherkin
Funcionalidade: Integração Mercado Pago QR Instore (Loja e Caixa)
  Como um administrador do sistema
  Eu quero provisionar uma loja e um ponto de venda (POS) no Mercado Pago
  Para que o fluxo de pagamento presencial via QR Code funcione corretamente

  Contexto:
    Dado que o arquivo ".env.local" contém as credenciais de teste do Mercado Pago
    E o Access Token "APP_USR-123456789" está configurado
    E o usuário "user_test_123" está configurado ou será resolvido via API

  # ============================================
  # PARTE 1 — PROVISIONAMENTO DA LOJA
  # ============================================

  @smoke @setup
  Cenário: Script de setup cria uma nova loja no Mercado Pago
    Quando o script "npm run mp:setup-store" é executado
    E a loja com external_id "SARRADABET001" não existe no MP
    Então o script faz uma requisição POST para "/users/{user_id}/stores"
    E a loja é criada com os dados:
      | campo          | valor                     |
      | name           | SarradaBet Store          |
      | business_hours | {}                        |
      | external_id    | SARRADABET001             |
    E o script recebe e armazena o "store_id" retornado

  @smoke @setup @idempotent
  Cenário: Script de setup é idempotente — não cria loja duplicada
    Dado que a loja com external_id "SARRADABET001" já existe no MP
    Quando o script "npm run mp:setup-store" é executado novamente
    Então o script faz uma requisição GET para buscar a loja existente
    E NÃO faz uma requisição POST para criar uma nova loja
    E o "store_id" retornado é o mesmo da execução anterior

  @setup @validation
  Cenário: Script falha com mensagem clara se Access Token estiver ausente
    Dado que a variável "MERCADOPAGO_ACCESS_TOKEN" não está definida no .env
    Quando o script "npm run mp:setup-store" é executado
    Então o script falha com erro "MERCADOPAGO_ACCESS_TOKEN é obrigatório"
    E o processo encerra com código de saída diferente de 0

  @setup @validation
  Cenário: Script falha se endereço da loja estiver incompleto
    Dado que a variável "MERCADOPAGO_STORE_STREET_NAME" não está definida
    Quando o script "npm run mp:setup-store" é executado
    Então o script falha com erro "Endereço da loja incompleto"
    E a loja NÃO é criada no Mercado Pago

  # ============================================
  # PARTE 2 — PROVISIONAMENTO DO POS (CAIXA)
  # ============================================

  @smoke @setup
  Cenário: Script de setup cria um novo POS (caixa) no Mercado Pago
    Dado que a loja "SARRADABET001" já existe
    Quando o script "npm run mp:setup-store" é executado
    E o POS com external_id "SARRADABET001POS001" não existe no MP
    Então o script faz uma requisição POST para "/pos"
    E o POS é criado com os dados:
      | campo          | valor                         |
      | name           | SarradaBet POS 01             |
      | external_id    | SARRADABET001POS001           |
      | fixed_amount   | true                          |
      | store_id       | (store_id da loja criada)     |
    E o script recebe e armazena o "pos_id" e o "pos_uuid" retornados
    E o "pos_uuid" é um identificador UUID válido para geração do QR Code

  @smoke @setup @idempotent
  Cenário: Script de setup é idempotente — não cria POS duplicado
    Dado que o POS com external_id "SARRADABET001POS001" já existe no MP
    Quando o script "npm run mp:setup-store" é executado novamente
    Então o script faz uma requisição GET para buscar o POS existente
    E NÃO faz uma requisição POST para criar um novo POS
    E o "pos_id" e "pos_uuid" retornados são os mesmos da execução anterior

  @setup @validation
  Cenário: Script falha se o store_id não for resolvido antes de criar o POS
    Dado que a criação da loja falhou (simulando erro de API)
    Quando o script tenta criar o POS
    Então o script falha com erro "Loja não disponível para criar POS"
    E o POS NÃO é criado no Mercado Pago

  # ============================================
  # PARTE 3 — SAÍDA DO SCRIPT (ENV BLOCK)
  # ============================================

  @smoke @setup
  Cenário: Script imprime bloco .env com os IDs gerados
    Dado que a loja e o POS foram criados com sucesso
    Quando o script "npm run mp:setup-store" termina
    Então o script imprime no console um bloco no formato .env contendo:
      | variável                      | formato         |
      | MERCADOPAGO_STORE_ID          | "123456789"     |
      | MERCADOPAGO_POS_ID            | "987654321"     |
      | MERCADOPAGO_POS_UUID          | "abc-123-def..."|
    E as instruções para adicionar essas variáveis ao .env.local são exibidas

  @setup
  Cenário: Script registra logs detalhados de cada etapa
    Quando o script "npm run mp:setup-store" é executado
    Então os logs incluem:
      | mensagem                                         |
      | "🔍 Resolvendo user_id..."                       |
      | "🔍 Buscando store com external_id: SARRADABET001" |
      | "✅ Store encontrada com ID: 123456789"           |
      | "🔍 Buscando POS com external_id: SARRADABET001POS001" |
      | "✅ POS encontrado com ID: 987654321"             |
      | "✅ Setup concluído!"                             |

  # ============================================
  # PARTE 4 — RUNTIME HELPER E VALIDAÇÃO
  # ============================================

  @runtime
  Cenário: Runtime helper retorna configuração completa quando envs estão presentes
    Dado que as variáveis MERCADOPAGO_STORE_ID, MERCADOPAGO_POS_ID e MERCADOPAGO_POS_UUID estão definidas
    Quando a função "getMercadoPagoInstoreRuntimeConfig()" é chamada
    Então a função retorna um objeto com:
      | campo       | valor                      |
      | storeId     | "123456789"                |
      | posId       | "987654321"                |
      | posUuid     | "abc-123-def-456"          |
      | isConfigured | true                      |

  @runtime @validation
  Cenário: Runtime helper falha com erro claro quando envs estão ausentes
    Dado que a variável MERCADOPAGO_STORE_ID NÃO está definida
    Quando a função "getMercadoPagoInstoreRuntimeConfig()" é chamada
    Então a função lança um erro contendo:
      "Missing Mercado Pago instore runtime environment variables"
    E a mensagem lista "MERCADOPAGO_STORE_ID"

  @runtime @validation
  Cenário: Validação falha se store_id estiver vazio ou inválido
    Dado que MERCADOPAGO_STORE_ID está definido como string vazia ""
    Quando a função de validação é executada
    Então a validação falha com erro "STORE_ID não pode estar vazio"

  # ============================================
  # PARTE 5 — INTEGRAÇÃO COM FLUXO ONLINE PIX
  # ============================================

  @smoke @integration
  Cenário: Fluxo online Pix existente permanece inalterado com o setup
    Dado que o script de setup foi executado e as variáveis de instore foram adicionadas ao .env
    Quando um usuário realiza uma compra de moedas via Pix online
    E o webhook de pagamento é recebido
    Então o fluxo online Pix funciona EXATAMENTE como antes
    E o serviço de Pix online NÃO utiliza MERCADOPAGO_STORE_ID ou MERCADOPAGO_POS_ID
    E o pagamento online é processado com sucesso

  @runtime @integration
  Cenário: Runtime helper para instore não interfere nas funções de pagamento online
    Dado que as variáveis de instore estão configuradas
    Quando o serviço de pagamento online é executado
    Então ele NÃO chama "getMercadoPagoInstoreRuntimeConfig()"
    E as funções de pagamento online utilizam apenas MERCADOPAGO_ACCESS_TOKEN

  # ============================================
  # PARTE 6 — CASOS DE BORDA
  # ============================================

  @edge @setup
  Cenário: Script lida com erro de API do Mercado Pago (timeout)
    Dado que a API do Mercado Pago está indisponível (simulando timeout)
    Quando o script "npm run mp:setup-store" é executado
    Então o script captura o erro e exibe uma mensagem clara
    E o processo encerra com código de saída diferente de 0
    E NENHUMA loja ou POS é criado parcialmente

  @edge @setup
  Cenário: Script lida com token inválido (401 Unauthorized)
    Dado que MERCADOPAGO_ACCESS_TOKEN está configurado com um token inválido
    Quando o script "npm run mp:setup-store" é executado
    Então o script captura o erro HTTP 401
    E exibe a mensagem "Token inválido. Verifique suas credenciais"
    E o processo encerra com código de saída diferente de 0

  @edge @setup
  Cenário: Script lida com coordenadas geográficas inválidas
    Dado que MERCADOPAGO_STORE_LATITUDE e MERCADOPAGO_STORE_LONGITUDE não são números válidos
    Quando o script "npm run mp:setup-store" é executado
    Então o script valida as coordenadas antes de chamar a API
    E exibe erro "Latitude e longitude devem ser números válidos"
    E a loja NÃO é criada

  @edge @setup
  Cenário: Script utiliza user_id do .env quando fornecido
    Dado que MERCADOPAGO_USER_ID está definido como "123456789"
    Quando o script "npm run mp:setup-store" é executado
    Então o script utiliza o user_id "123456789" diretamente
    E NÃO faz uma requisição GET para "/users/me" para resolver o user_id

  @edge @setup
  Cenário: Script resolve user_id via API quando não fornecido no .env
    Dado que MERCADOPAGO_USER_ID NÃO está definido
    Quando o script "npm run mp:setup-store" é executado
    Então o script faz uma requisição GET para "/users/me" com o Access Token
    E utiliza o user_id retornado da API
```

## Implementation checklist

- [x] `MercadoPagoInstoreClient` with store/POS create + search
- [x] Env schema for setup + runtime IDs
- [x] Idempotent `mp:setup-store` script
- [x] `getMercadoPagoInstoreRuntimeConfig()` for step 3 consumers
- [x] QR order creation service
- [x] Webhook handling for instore orders
- [x] UI for presencial QR payments
- [x] Admin caixa QR + payment monitor UI
- [x] Admin payment API (`/admin/payments`)
- [x] Unit/integration/E2E test coverage
- [x] Live setup validator (`mp:validate-live`)

## Key files

| File | Role |
|------|------|
| `MercadoPagoInstoreClient.ts` | REST calls to MP stores/POS/orders APIs |
| `InstorePaymentService.ts` | Dynamic QR orders + confirm + coin credit |
| `AdminPaymentService.ts` | Admin list/detail + create on behalf |
| `instoreConfig.ts` | Validates setup/runtime env groups |
| `setupMercadoPagoStore.ts` | One-time provisioning CLI |
| `validateMercadoPagoLiveSetup.ts` | Live env + MP API ping checklist |
| `AdminPaymentsPage.tsx` | Admin caixa + monitor UI |
| `mercadopagoInstoreClient.test.ts` | Unit tests with mocked axios |
| `instoreConfig.test.ts` / `instorePayment.service.test.ts` | Service/config unit tests |
| `admin-payment.routes.test.ts` | Admin payment integration tests |

## Acceptance criteria

- [x] Script creates store + POS with test credentials
- [x] Re-run returns same IDs without duplicate errors
- [x] Online Pix flow unchanged
- [x] Runtime helper fails clearly when step 3 env IDs missing

## Dependencies

- Feature 02 (online Pix) — shared Mercado Pago env; see [Sandbox testing](#sandbox-testing) for dual-token setup
- Mercado Pago QR Code integration docs (step 1 application, step 2 store/POS)

## Test plan

```bash
cd apps/api
npm run test:unit -- instoreConfig instorePayment mercadopagoInstore env.mockPix
npm run test:integration -- admin-payment instore-payment instore-webhook
cd ../..
npm run test:e2e:smoke   # includes QR presencial + admin caixa scenarios
npm run mp:validate-live -- --ping   # verify credentials + instore IDs
```

Manual live Pix: see [`LOCAL_WEBHOOKS.md`](../LOCAL_WEBHOOKS.md) — pay with MP test buyer; confirm coins credit via webhook or status poll.

### Live validation log (2026-08-04)

| Check | Result |
|-------|--------|
| MP credentials + `/users/me` | Pass (`mp:validate-live --ping`) |
| Instore store/POS IDs configured | Pass |
| `MERCADOPAGO_MOCK_PIX=false` parsing | Pass (fixed env boolean coercion bug) |
| Online Pix → coins (manual test buyer) | Pending — run with ngrok locally or use deployed API webhook URL |
| Instore QR → coins (manual test buyer) | Pending — scan QR with MP app; paste often fails (see [Sandbox testing](#sandbox-testing)) |
| Production go-live | See [Mercado Pago Production](../MERCADOPAGO_PRODUCTION.md) |
| Instore QR → coins (manual test buyer) | Pending — scan QR with MP app; paste often fails (see [Sandbox testing](#sandbox-testing)) |
| Production go-live | See [Mercado Pago Production](../MERCADOPAGO_PRODUCTION.md) |

## Sandbox testing

Mercado Pago does **not** expose a separate sandbox API. Local tests hit the production API with **test credentials** and **test accounts** created under [Suas integrações](https://www.mercadopago.com.br/developers/panel/app). SarradaBet runs **two payment flows** that use **different credential prefixes** — this is the main source of confusion during live testing.

### Official Mercado Pago documentation

| Topic | Link |
|-------|------|
| Test accounts (Checkout / Pix) | [Contas de teste — Checkout API](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/additional-content/your-integrations/test/accounts) |
| Test accounts (QR presencial) | [Contas de teste — QR Code](https://www.mercadopago.com.br/developers/pt/docs/qr-code/resources/test-accounts) |
| Credentials (`TEST-` vs `APP_USR-`) | [Credenciais](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/credentials) |
| Pix online integration | [Integrar Pix — Checkout API](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/integration-configuration/integrate-with-pix) |
| QR order creation (Orders API) | [Criar order — QR dynamic](https://www.mercadopago.com.br/developers/pt/reference/in-person-payments/qr-code/orders/create-order/post) |
| QR → Orders API migration (payload + webhooks) | [Migrar QR para Orders API](https://www.mercadopago.com.br/developers/pt/docs/qr-code-migration/overview) |
| QR notifications (`order` topic) | [Notificações — QR Code](https://www.mercadopago.com.br/developers/pt/docs/qr-code/notifications) |
| Error 145 — Invalid users involved | [Erros de pagamento](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/error-messages/card-token-creation-errors) |
| Local webhooks (ngrok) | [`LOCAL_WEBHOOKS.md`](../LOCAL_WEBHOOKS.md) |

### Three roles (do not mix them up)

| Role | Who | Used for |
|------|-----|----------|
| **SarradaBet user** | e.g. `user` / `user123` on `/coins` | Receives coins in the app after payment |
| **MP seller (vendedor)** | Test account `TESTUSER548...` (`APP_USR-` token) | Receives Pix on QR presencial flow |
| **MP buyer (comprador)** | Test account `TESTUSER608...` | Pays Pix in Mercado Pago (app or site) |
| **Real integrator** | Your developer account (Lucas) | Owns the app in the panel; may appear on Pix online sandbox tickets when using `TEST-` credentials |

Logging into Mercado Pago to **pay** must use the **buyer test user** (`Usuário` + `Senha` + **Código de verificação** from [Contas de teste](https://www.mercadopago.com.br/developers/panel/app/7716487240713931/test-accounts)). RG/CNH prompts mean a **real account** is active — use incognito and never your personal MP session.

### Dual credentials in SarradaBet

| Flow | API | Env var | Typical prefix | Webhook topic |
|------|-----|---------|----------------|---------------|
| **Pix online** (`/coins` → Pix online) | Payments API | `MERCADOPAGO_PAYMENTS_ACCESS_TOKEN` | `TEST-` | `payment` |
| **QR presencial** (`/coins` or `/admin/payments`) | Orders API | `MERCADOPAGO_INSTORE_ACCESS_TOKEN` | `APP_USR-` | `order` |

Implementation: [`resolvePixPayerEmail.ts`](../../apps/api/src/modules/payment/resolvePixPayerEmail.ts), [`MercadoPagoClient.ts`](../../apps/api/src/modules/payment/services/MercadoPagoClient.ts), [`MercadoPagoInstoreClient.ts`](../../apps/api/src/modules/payment/services/MercadoPagoInstoreClient.ts).

### Common sandbox errors

| Error | Cause | What to do |
|-------|-------|------------|
| **Unauthorized use of live credentials** | Payments API called with wrong token type for the product | Use `TEST-` for Pix online; `APP_USR-` test creds for QR/Orders |
| **Invalid users involved** (145) | Mixing a **real** collector (`TEST-` integrator token) with a **test** payer email (`test_user_br@...`) | Keep app user email (`user@sarradabet.com`) when creating Pix with `TEST-`; do not force sandbox payer emails unless MP docs require it for your app |
| **Payer email forbidden** | Payer email format not accepted by Payments API (e.g. `test_payer_{id}@testuser.com`) | Leave `MERCADOPAGO_TEST_PAYER_EMAIL` unset; use app user email |
| **create instore order 400** | Orders API payload included removed fields (`notification_url`, `payment_method` in `transactions.payments[]`) | Fixed in `MercadoPagoInstoreClient.createOrder`; configure webhooks in the MP panel instead |
| **Paste Pix gray / disabled** | Instore `qr_data` is for **scanning** with the MP app, not copia-e-cola | Scan QR from a **second device** logged in as buyer test user |
| **RG/CNH on phone** | Mercado Pago app logged in as **real** account | Log out everywhere; pay from **desktop incognito** as buyer test user, or ignore phone |

### Recommended local test paths

1. **App logic (no MP)** — `MERCADOPAGO_MOCK_PIX=true` → **Simular aprovação** on `/coins`. Validates coins, webhooks, and UI without MP.
2. **Webhook + API (partial live)** — Pix online with `TEST-` token creates a [sandbox ticket](https://www.mercadopago.com.br/sandbox/payments/{id}/ticket). Collector may show the real integrator name; that is expected. Confirm webhook delivery via ngrok (`npm run webhook:tunnel` + `npm run webhook:configure`) and [`notifications_history`](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications) in MCP.
3. **Full instore live** — QR presencial → scan with MP app as **buyer test user** on a second device → `order` webhook → coins credited.
4. **Preflight** — `npm run mp:validate-live -- --ping` (both tokens + instore store/POS IDs).

### Paying without a phone

- **Pix online:** open the sandbox ticket in **desktop incognito** logged in as **buyer test user** only; pay from the ticket page or paste the code there — not from your real MP app.
- **QR presencial:** requires scanning; a second device (or another person's phone logged in as buyer test user) is effectively required.
- Do **not** pay sandbox Pix from a **real bank app** — sandbox codes are not on the production Pix network.

### Environment example (local)

```env
# apps/api/.env.local
MERCADOPAGO_PAYMENTS_ACCESS_TOKEN=TEST-...
MERCADOPAGO_INSTORE_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_NOTIFICATION_URL=https://<ngrok-host>/api/v1/webhooks/mercadopago
MERCADOPAGO_MOCK_PIX=false
MERCADOPAGO_STORE_ID=...
MERCADOPAGO_POS_ID=...
MERCADOPAGO_POS_UUID=...
```

Do **not** set `MERCADOPAGO_TEST_PAYER_EMAIL` unless Mercado Pago support gives you a value for your app. The default is the SarradaBet user's email.

## Related documentation

- [Feature 02 — Coins & Pix](./02-coins-and-pix-payments.md)
- [Mercado Pago Production](../MERCADOPAGO_PRODUCTION.md) — go-live checklist
- [Deployment](../DEPLOYMENT.md) — production env vars
- [Mercado Pago — Criar loja e caixa](https://www.mercadopago.com.br/developers/pt/docs/qr-code/create-store-and-pos)
