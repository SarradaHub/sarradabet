# Action Plan 12 — Push Notifications

## 1. Goal

Implement Expo push notifications for payment confirmed, bet won, and reward redeemed. Register device tokens on mobile login; send via Expo Push API from the API after existing Socket.io emits.

## 2. Market Research / Requirements

Feature 06 Part 3 (push) and Part 9 edge case (no token) in [Feature 06](../features/06-mobile-app-and-admin-panel.md).

**Events to push:**

| Event | Trigger (existing) | Notification |
|-------|-------------------|--------------|
| Payment confirmed | `PixPaymentService` / `InstorePaymentService` → `emitPaymentConfirmed` | "Pagamento confirmado!" |
| Bet won | `payout.worker.ts` → `emitBetResolved` | "Você ganhou sua aposta!" |
| Reward redeemed | `RewardService` → redeem success | "Recompensa resgatada!" |

**Edge case:** No push token registered → log warning, do **not** fail the primary operation (credit coins, payout, etc.).

**Depends on:** plan 10 (mobile app for token registration). API module can be built in parallel but E2E needs the app.

## 3. Tech Stack & Dependencies

| Item | Purpose |
|------|---------|
| `expo-notifications` | Mobile token + foreground/background handlers |
| Expo Push API | `https://exp.host/--/api/v2/push/send` |
| Prisma `PushToken` | Store device tokens per user |
| `apps/api/src/modules/notification/` | Registration + send service |
| Existing realtime emitter | Hook points after Socket emits |

**Environment (API):**

```env
# Optional — Expo push works without access token for basic sends
EXPO_ACCESS_TOKEN=
```

## 4. MCPs to Utilize

| MCP | Cursor mapping | When to use |
|-----|----------------|-------------|
| `@modelcontextprotocol/server-filesystem` | Built-in Read/Write | Schema, notification module, mobile handlers |
| `@modelcontextprotocol/server-git` | Shell `git` | Branch `feature/push-notifications` |
| `@modelcontextprotocol/server-postgres` | Prisma CLI | Verify PushToken rows |

## 5. Engineering Rules

### TDD

- Integration test: `POST /notifications/register-token` stores token for authenticated user.
- Integration test: unregister on logout removes token.
- Unit test: `NotificationService.sendToUser` skips when no tokens (logs warning).
- Unit test: payload builder for each event type.
- Mock Expo Push API in tests (nock/fetch mock).

### Clean Code

- `NotificationService` is fire-and-forget from payment/payout paths — catch errors internally, never throw to caller.
- Deduplicate tokens per user (unique constraint on `token` string).
- Mobile: request permissions before registering token.

### Design Patterns

- **Repository → Service → Controller → Routes** for token registration.
- **Observer hook**: call notification service after successful Socket emit (or inside emitter wrapper).

### Best Practices

- Include `data.type` in payload for deep linking (`payment_confirmed`, `bet_won`, `reward_redeemed`).
- Remove invalid Expo tokens (DeviceNotRegistered) from DB on send failure.
- Update [`docs/API.md`](../API.md) and `@sarradabet/types`.
- Run `npm run lint`, `npm run check-types`, `npm run test:api:integration`.

## 6. Step-by-Step Implementation Checklist

### Phase A — Schema & types

- [ ] **MCP: filesystem** — Add Prisma model:

```prisma
model PushToken {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  token     String   @unique
  platform  String   // ios | android
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("push_tokens")
}
```

- [ ] Add `pushTokens PushToken[]` relation on `User`.
- [ ] Run `npm run prisma:migrate:dev -- --name add_push_tokens`.
- [ ] **MCP: filesystem** — Add types in `packages/types/src/notification.ts`:

```typescript
export interface RegisterPushTokenRequest {
  token: string;
  platform: "ios" | "android";
}

export type PushNotificationType =
  | "payment_confirmed"
  | "bet_won"
  | "reward_redeemed";
```

- [ ] Export from `packages/types/src/index.ts`.

### Phase B — API notification module (TDD)

- [ ] **MCP: git** — Branch `feature/push-notifications`.
- [ ] **Write test first**: `apps/api/src/__tests__/integration/notifications.register.test.ts`.
- [ ] **MCP: filesystem** — Create `apps/api/src/modules/notification/`:
  - `PushTokenRepository`
  - `NotificationService` — `registerToken`, `unregisterToken`, `sendToUser(userId, notification)`
  - `NotificationController`
  - `notification.routes.ts`
- [ ] Routes:

```
POST   /api/v1/notifications/register-token   — authenticated
DELETE /api/v1/notifications/register-token   — authenticated (body: { token })
```

- [ ] **MCP: filesystem** — Implement Expo Push sender (fetch to exp.host).
- [ ] Mount routes in [`routes/index.ts`](../../apps/api/src/routes/index.ts).

### Phase C — Hook into existing events

- [ ] **MCP: filesystem** — After `emitPaymentConfirmed` in [`PixPaymentService`](../../apps/api/src/modules/payment/services/PixPaymentService.ts) and [`InstorePaymentService`](../../apps/api/src/modules/payment/services/InstorePaymentService.ts):

```typescript
void notificationService.sendPaymentConfirmed(userId, { coins, amountCents });
```

- [ ] **MCP: filesystem** — After `emitBetResolved` in [`payout.worker.ts`](../../apps/api/src/jobs/payout.worker.ts).
- [ ] **MCP: filesystem** — After reward redeem in [`RewardService`](../../apps/api/src/modules/reward/services/RewardService.ts).
- [ ] Each call wrapped in try/catch; log warning on failure.

### Phase D — Mobile integration

- [ ] **MCP: filesystem** — Install `expo-notifications` in `apps/mobile`.
- [ ] **MCP: filesystem** — Configure `app.json` / `app.config.js` for notification permissions.
- [ ] **MCP: filesystem** — Create `src/notifications/registerPushToken.ts`:
  - Request permissions
  - Get Expo push token
  - `POST /notifications/register-token` after login
- [ ] **MCP: filesystem** — On logout: `DELETE /notifications/register-token`.
- [ ] **MCP: filesystem** — Foreground notification handler (optional in-app banner).
- [ ] **MCP: filesystem** — Tap handler: deep link to relevant screen based on `data.type`.

### Phase E — Documentation

- [ ] **MCP: filesystem** — Update [`docs/API.md`](../API.md).
- [ ] **MCP: filesystem** — Update `apps/mobile/README.md` (physical device required for push testing).
- [ ] **MCP: filesystem** — Check off Feature 06 push items; remove from ROADMAP when shipped.

## 7. UI/UX Implementation Details

- Request permission dialog after first successful login (not on app open).
- Settings toggle "Notificações" in Profile (optional stretch — default enabled).
- Foreground: show in-app toast matching push title/body.
- Deep links:
  - `payment_confirmed` → Coins/Dashboard tab
  - `bet_won` → Home (bet list)
  - `reward_redeemed` → Profile/history

## 8. Code Snippets / Pseudo-code

### NotificationService.sendToUser

```typescript
async sendToUser(userId: number, message: ExpoPushMessage): Promise<void> {
  const tokens = await this.repo.findByUserId(userId);
  if (tokens.length === 0) {
    logger.warn("Usuário sem token de push registrado", { userId });
    return;
  }

  const messages = tokens.map((t) => ({
    to: t.token,
    sound: "default",
    title: message.title,
    body: message.body,
    data: message.data,
  }));

  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });
    await this.handleExpoErrors(res, tokens);
  } catch (err) {
    logger.error("Falha ao enviar push", { userId, err });
  }
}
```

### Mobile registration (after login)

```typescript
const { status } = await Notifications.requestPermissionsAsync();
if (status !== "granted") return;

const token = (await Notifications.getExpoPushTokenAsync()).data;
await client.notifications.registerToken({
  token,
  platform: Platform.OS === "ios" ? "ios" : "android",
});
```

## 9. Testing & Success Criteria

### Automated

- [ ] Integration: register token → row in `push_tokens`.
- [ ] Integration: delete token on logout.
- [ ] Unit: send skipped when no tokens (warning logged).
- [ ] Unit: payment/bet/reward hooks call notification service.
- [ ] `npm run lint`, `npm run check-types` clean.

### Manual QA (physical device or Expo push tool)

- [ ] Login on device → token registered in DB.
- [ ] Confirm mock Pix payment → push received on device.
- [ ] Resolve bet with user as winner → push received.
- [ ] Redeem reward → push received.
- [ ] Logout → token removed; no push after logout.

### Success criteria

Push notifications are complete when tokens register/unregister correctly, three event types deliver pushes via Expo, missing tokens never block money operations, tests green, and API docs updated.

**Depends on:** plan 10 for E2E; API can start in parallel.
