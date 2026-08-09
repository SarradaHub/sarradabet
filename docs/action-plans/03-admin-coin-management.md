# Action Plan 03 — Admin Coin Management

## 1. Goal

Create an admin-only API and UI to manually credit or debit user coin balances, recording each change as a `CoinTransaction` with source `ADMIN_ADJUSTMENT` and an audit log entry for accountability.

## 2. Market Research / Requirements

Not applicable — internal admin capability. Already specified in [`docs/features/06-mobile-app-and-admin-panel.md`](../features/06-mobile-app-and-admin-panel.md):

- Route: `POST /api/v1/admin/users/:id/coins/adjust`
- Source enum `ADMIN_ADJUSTMENT` exists in Prisma and [`packages/types/src/coin.ts`](../../packages/types/src/coin.ts)
- [`CoinService`](../../apps/api/src/modules/coin/services/CoinService.ts) has `creditCoins` / `debitCoins` — reuse, do not duplicate balance logic

**Note:** Original prompt suggested `/api/admin/users/update-coins`. Use the Feature 06 route under `/api/v1/admin/` to match existing API versioning and module conventions.

## 3. Tech Stack & Dependencies

| Item | Path / package | Purpose |
|------|----------------|---------|
| Prisma | `apps/api/prisma/schema.prisma` | `AdminAuditLog` model (new) |
| `CoinService` | `apps/api/src/modules/coin/services/CoinService.ts` | Atomic credit/debit |
| `AuthMiddleware` | `apps/api/src/core/middleware/AuthMiddleware.ts` | `requireUserRole(UserRole.ADMIN)` |
| Zod | `ValidationSchemas.ts` | `AdjustCoinsSchema` |
| `@sarradabet/types` | `packages/types` | Request/response DTOs |
| Admin UI | `AdminUsersPage`, `EditUserModal` | Form for amount + reason |
| Jest + Supertest | `apps/api/src/__tests__/integration/` | Integration tests |

## 4. MCPs to Utilize

| MCP | Cursor mapping | When to use |
|-----|----------------|-------------|
| `@modelcontextprotocol/server-filesystem` | Built-in Read/Write | Schema, services, routes, admin UI, tests |
| `@modelcontextprotocol/server-git` | Shell `git` | Branch `feature/admin-coin-adjust` |
| `@modelcontextprotocol/server-postgres` | `plugin-supabase-supabase` / Prisma CLI | Verify migration, query audit rows |
| `@modelcontextprotocol/server-browser` | `cursor-ide-browser` | Test admin adjust flow in UI |

## 5. Engineering Rules

### TDD

- Write failing integration test: non-admin → 403 before route exists.
- Write failing test: credit → balance increases + `ADMIN_ADJUSTMENT` transaction + audit log.
- Write failing test: debit below zero → 400, balance unchanged (transaction rolled back).
- Web: RTL test for adjust form validation (positive amount, required reason).

### Clean Code

- Controller parses/validates only; `AdminCoinService.adjustBalance()` owns business rules.
- Single Prisma `$transaction` wraps balance update + transaction row + audit log.
- Reuse `CoinService.creditCoins` / `debitCoins` inside transaction — pass `txClient`.

### Design Patterns

- **Repository → Service → Controller → Routes** (existing Clean Architecture).
- **RBAC middleware** chain: `authenticateUser` → `requireUserRole(UserRole.ADMIN)`.
- **Audit trail** via dedicated `AdminAuditLog` repository.

### Best Practices

- Require non-empty `reason` string (min 3 chars) for every adjustment.
- Log `adminId`, `targetUserId`, `amount`, `direction`, `reason`, `balanceBefore`, `balanceAfter`.
- Never allow negative balance on debit — throw `BadRequestError`.
- Update [`docs/API.md`](../API.md) and `@sarradabet/types`.
- Run `npm run lint`, `npm run check-types`, `npm run test:api:integration`.

## 6. Step-by-Step Implementation Checklist

### Phase A — Schema & types (TDD setup)

- [ ] **MCP: filesystem** — Read [`schema.prisma`](../../apps/api/prisma/schema.prisma), [`coin.ts`](../../packages/types/src/coin.ts).
- [ ] **MCP: filesystem** — Add `AdminAuditLog` model:

```prisma
model AdminAuditLog {
  id            Int      @id @default(autoincrement())
  adminId       Int      @map("admin_id")
  action        String   // COIN_ADJUST
  targetUserId  Int      @map("target_user_id")
  payload       Json     // { amount, direction, reason, balanceBefore, balanceAfter }
  createdAt     DateTime @default(now()) @map("created_at")

  admin         User     @relation("AdminAuditLogs", fields: [adminId], references: [id])
  targetUser    User     @relation("TargetAuditLogs", fields: [targetUserId], references: [id])

  @@map("admin_audit_logs")
}
```

- [ ] **MCP: filesystem** — Add types to `packages/types/src/coin.ts`:

```typescript
export interface AdjustCoinsRequest {
  amount: number;
  direction: "credit" | "debit";
  reason: string;
}

export interface AdjustCoinsResponse {
  balance: number;
  transactionId: number;
}
```

- [ ] Run `npm run prisma:migrate:dev -- --name add_admin_audit_log`.
- [ ] **MCP: postgres** — Verify tables.

### Phase B — API (TDD: tests first)

- [ ] **MCP: git** — Branch `feature/admin-coin-adjust`.
- [ ] **Write test first**: `apps/api/src/__tests__/integration/admin.coins.adjust.test.ts`:
  - 401 without auth
  - 403 as USER role
  - 200 credit with valid admin
  - 400 debit exceeding balance
  - Audit log row created
- [ ] **MCP: filesystem** — Add `AdjustCoinsSchema` to validation schemas.
- [ ] **MCP: filesystem** — Create `AdminAuditLogRepository`.
- [ ] **MCP: filesystem** — Create `AdminCoinService.adjustBalance(adminId, userId, dto)`.
- [ ] **MCP: filesystem** — Create `AdminCoinController.adjust`.
- [ ] **MCP: filesystem** — Add route module `apps/api/src/modules/admin/routes/admin.users.routes.ts`:

```
POST /api/v1/admin/users/:id/coins/adjust
  authenticateUser, requireUserRole(ADMIN), ValidationMiddleware(AdjustCoinsSchema)
```

- [ ] Mount in [`routes/index.ts`](../../apps/api/src/routes/index.ts).
- [ ] Run tests → green → refactor.

### Phase C — Admin UI

- [ ] **Write test first**: `EditUserModal` or new `AdjustCoinsModal` RTL tests.
- [ ] **MCP: filesystem** — Add `adjustUserCoins(userId, dto)` to admin API client / service.
- [ ] **MCP: filesystem** — Extend [`EditUserModal.tsx`](../../apps/web/src/components/admin/EditUserModal.tsx) or add `AdjustCoinsModal` with:
  - Current balance (read-only)
  - Direction select (credit/debit)
  - Amount (positive integer)
  - Reason (textarea, required)
  - Submit → toast success/error
- [ ] **MCP: filesystem** — Wire into [`AdminUsersPage.tsx`](../../apps/web/src/pages/AdminUsersPage.tsx) row actions.
- [ ] **MCP: browser** — Admin login → Users → adjust coins → verify balance updates.

### Phase D — Documentation

- [ ] **MCP: filesystem** — Update [`docs/API.md`](../API.md).
- [ ] **MCP: filesystem** — Check off coin adjust items in Feature 06 checklist.

## 7. UI/UX Implementation Details

- Show current `coinBalance` prominently before adjustment.
- Use color coding: green for credit, red for debit (confirm destructive debit with modal).
- Display last 5 `ADMIN_ADJUSTMENT` transactions in user detail panel (optional enhancement).
- Disable submit while request in flight; show validation errors inline.
- Portuguese labels: "Ajustar moedas", "Creditar", "Debitar", "Motivo", "Saldo atual".

## 8. Code Snippets / Pseudo-code

### AdminCoinService

```typescript
// apps/api/src/modules/admin/services/AdminCoinService.ts
async adjustBalance(
  adminId: number,
  targetUserId: number,
  dto: AdjustCoinsRequest,
): Promise<AdjustCoinsResponse> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: targetUserId } });
    const balanceBefore = user.coinBalance;

    const metadata = {
      source: "ADMIN_ADJUSTMENT" as const,
      referenceId: String(adminId),
      description: dto.reason,
    };

    const txn =
      dto.direction === "credit"
        ? await this.coinService.creditCoins(targetUserId, dto.amount, metadata, tx)
        : await this.coinService.debitCoins(targetUserId, dto.amount, metadata, tx);

    const updated = await tx.user.findUniqueOrThrow({ where: { id: targetUserId } });

    await this.auditRepo.create(tx, {
      adminId,
      action: "COIN_ADJUST",
      targetUserId,
      payload: {
        amount: dto.amount,
        direction: dto.direction,
        reason: dto.reason,
        balanceBefore,
        balanceAfter: updated.coinBalance,
      },
    });

    return { balance: updated.coinBalance, transactionId: txn.id };
  });
}
```

### Route registration

```typescript
router.post(
  "/users/:id/coins/adjust",
  authenticateUser,
  requireUserRole(UserRole.ADMIN),
  ValidationMiddleware(AdjustCoinsSchema),
  adminCoinController.adjust,
);
```

### Admin modal (web)

```tsx
<form onSubmit={handleSubmit}>
  <p>Saldo atual: {user.coinBalance} moedas</p>
  <select value={direction} onChange={...}>
    <option value="credit">Creditar</option>
    <option value="debit">Debitar</option>
  </select>
  <input type="number" min={1} value={amount} required />
  <textarea value={reason} required minLength={3} placeholder="Motivo do ajuste" />
  <button type="submit">Confirmar ajuste</button>
</form>
```

## 9. Testing & Success Criteria

### Automated

- [ ] Integration: 403 for non-admin, 401 unauthenticated.
- [ ] Integration: credit increases balance; `CoinTransaction.source === ADMIN_ADJUSTMENT`.
- [ ] Integration: debit fails when insufficient balance; no partial update.
- [ ] Integration: `AdminAuditLog` row matches payload.
- [ ] Web RTL: form validation, success toast.
- [ ] `npm run lint`, `npm run check-types` clean.

### Manual (MCP: browser)

- [ ] Admin credits 100 coins → user balance +100 on Coins page.
- [ ] Admin debits with valid reason → balance decreases.
- [ ] Debit beyond balance shows error, balance unchanged.
- [ ] Transaction history shows "Ajuste admin".

### Success criteria

Admin coin management is complete when secured adjust API works atomically with audit trail, admin UI functional, tests green, and API docs updated.
