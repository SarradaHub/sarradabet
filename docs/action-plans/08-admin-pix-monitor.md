# Action Plan 08 — Admin Pix Payment Monitor

## 1. Goal

Give administrators a read-only API and web UI to list, filter, and inspect Pix payments (online and instore share the [`PixPayment`](../../apps/api/prisma/schema.prisma) model).

## 2. Market Research / Requirements

Not applicable — internal admin capability. Specified in [Feature 06 Part 5](../features/06-mobile-app-and-admin-panel.md):

- `GET /api/v1/admin/payments/pix` — filter by `status`, `startDate`, `endDate`, `userId`, pagination
- `GET /api/v1/admin/payments/pix/:id` — detail with user email/username
- Status values: `PENDING`, `APPROVED`, `EXPIRED`, `CANCELLED`, `FAILED`

**Current state:**

- User-facing routes only: `POST /payments/pix`, `GET /payments/pix/:id` in [`payment.routes.ts`](../../apps/api/src/routes/payment.routes.ts)
- No admin payment routes or `AdminPaymentsPage`
- [`AdminLayout.tsx`](../../apps/web/src/components/admin/AdminLayout.tsx) has no Pix nav link
- Instore payments also use `PixPayment` with `channel: "instore"` in service responses

**Out of scope:** Refunds, manual status override, webhook replay.

## 3. Tech Stack & Dependencies

| Item | Path / package | Purpose |
|------|----------------|---------|
| Prisma | `PixPayment` model (existing) | Query with filters |
| `AuthMiddleware` | `authenticateUser` + `requireUserRole(ADMIN)` | Admin-only |
| Zod | `ValidationSchemas.ts` | `AdminPixPaymentsQuerySchema` |
| `@sarradabet/types` | `packages/types/src/payment.ts` | Admin list/detail DTOs |
| Admin UI | `AdminPaymentsPage` (new) | Table + filters + detail drawer |
| Recharts | already in admin | Optional status breakdown chart |
| Jest + Supertest | integration tests | API coverage |

## 4. MCPs to Utilize

| MCP | Cursor mapping | When to use |
|-----|----------------|-------------|
| `@modelcontextprotocol/server-filesystem` | Built-in Read/Write | Repository, routes, admin page, types |
| `@modelcontextprotocol/server-git` | Shell `git` | Branch `feature/admin-pix-monitor` |
| `@modelcontextprotocol/server-postgres` | Prisma CLI | Verify query filters |
| `@modelcontextprotocol/server-browser` | `cursor-ide-browser` | Test filter UI and detail view |

## 5. Engineering Rules

### TDD

- Write failing integration test: `GET /admin/payments/pix` → 403 for USER role.
- Write failing test: filter by `status=PENDING` returns only pending rows.
- Write failing test: date range + `userId` filters combine correctly.
- Write failing test: detail includes user email/username.
- Web: RTL test for status filter dropdown and table rendering.

### Clean Code

- Read-only admin module — no mutations in this plan.
- Repository owns Prisma query building; controller is thin.
- Reuse existing payment mappers where possible; add admin-specific DTO with user fields.

### Design Patterns

- **Repository → Service → Controller → Routes** under `apps/api/src/modules/admin/`.
- Paginated response shape matches admin users list (plan 07) for consistency.

### Best Practices

- Default sort: `createdAt desc`.
- Do not expose full `qrCodeBase64` in list view (detail only, or truncate).
- Index already exists on `[userId, status]` and `[expiresAt]` — verify query plans.
- Update [`docs/API.md`](../API.md) and `@sarradabet/types`.
- Run `npm run lint`, `npm run check-types`, `npm run test:api:integration`.

## 6. Step-by-Step Implementation Checklist

### Phase A — Types

- [ ] **MCP: filesystem** — Read [`payment.ts`](../../packages/types/src/payment.ts), [`PixPaymentService`](../../apps/api/src/modules/payment/services/PixPaymentService.ts).
- [ ] **MCP: filesystem** — Add admin DTOs:

```typescript
export interface AdminPixPaymentListItem {
  id: number;
  userId: number;
  userEmail: string;
  userUsername: string;
  amountCents: number;
  coinsAmount: number;
  status: PixPaymentStatus;
  externalId: string;
  expiresAt: string;
  paidAt: string | null;
  createdAt: string;
  channel?: PixPaymentChannel;
}

export interface AdminPixPaymentsListResponse {
  items: AdminPixPaymentListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminPixPaymentDetail extends AdminPixPaymentListItem {
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  packageName: string;
  idempotencyKey: string;
}
```

### Phase B — API (TDD: tests first)

- [ ] **MCP: git** — Branch `feature/admin-pix-monitor`.
- [ ] **Write test first**: `apps/api/src/__tests__/integration/admin.payments.pix.test.ts`:
  - 401 without auth
  - 403 as USER role
  - 200 list with status filter
  - 200 list with date range + userId
  - 200 detail with user info
  - 404 for unknown payment id
- [ ] **MCP: filesystem** — Add `AdminPixPaymentsQuerySchema`.
- [ ] **MCP: filesystem** — Create `AdminPaymentRepository` (list + findById with user join).
- [ ] **MCP: filesystem** — Create `AdminPaymentService` and `AdminPaymentController`.
- [ ] **MCP: filesystem** — Create `apps/api/src/modules/admin/routes/admin.payments.routes.ts`:

```
GET /api/v1/admin/payments/pix       — paginated list
GET /api/v1/admin/payments/pix/:id   — detail
```

- [ ] Mount in [`routes/index.ts`](../../apps/api/src/routes/index.ts) with `authenticateUser` + `requireUserRole(ADMIN)`.
- [ ] Run tests → green → refactor.

### Phase C — Admin UI

- [ ] **Write test first**: RTL tests for filter controls and status badges.
- [ ] **MCP: filesystem** — Create `AdminPaymentService.ts` in web (API client calls).
- [ ] **MCP: filesystem** — Create [`AdminPaymentsPage.tsx`](../../apps/web/src/pages/AdminPaymentsPage.tsx):
  - Status filter dropdown (`PENDING`, `APPROVED`, `EXPIRED`, etc.)
  - Date range inputs (optional)
  - User ID filter (optional)
  - Paginated table: id, user, amount, status, dates
  - Row click → detail modal/drawer with QR code preview
- [ ] **MCP: filesystem** — Add nav link "Pagamentos Pix" in [`AdminLayout.tsx`](../../apps/web/src/components/admin/AdminLayout.tsx).
- [ ] **MCP: filesystem** — Register route `/admin/payments` in [`App.tsx`](../../apps/web/src/App.tsx) (lazy-loaded).
- [ ] **MCP: browser** — Admin login → Pagamentos Pix → filter PENDING → open detail.

### Phase D — Documentation

- [ ] **MCP: filesystem** — Update [`docs/API.md`](../API.md).
- [ ] **MCP: filesystem** — Check off Pix monitor in Feature 06; remove from ROADMAP when shipped.

## 7. UI/UX Implementation Details

- Status badges: yellow PENDING, green APPROVED, gray EXPIRED, red FAILED/CANCELLED.
- Amount display: format cents as `R$ X,XX`.
- Detail modal: show QR code image when `qrCodeBase64` present; copy-paste code button.
- Empty state: "Nenhum pagamento encontrado" with clear-filters action.
- Portuguese labels: "Pagamentos Pix", "Status", "Período", "Detalhes".

## 8. Code Snippets / Pseudo-code

### Repository query

```typescript
const where: Prisma.PixPaymentWhereInput = {
  ...(status && { status }),
  ...(userId && { userId }),
  ...(startDate || endDate
    ? {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }
    : {}),
};

const [items, total] = await Promise.all([
  prisma.pixPayment.findMany({
    where,
    include: { user: { select: { email: true, username: true } } },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  }),
  prisma.pixPayment.count({ where }),
]);
```

### Route registration

```typescript
router.get(
  "/pix",
  validateQuery(AdminPixPaymentsQuerySchema),
  adminPaymentController.list,
);
router.get(
  "/pix/:id",
  validateParams(ParamIdSchema),
  adminPaymentController.getById,
);
```

## 9. Testing & Success Criteria

### Automated

- [ ] Integration: 403 for non-admin, 401 unauthenticated.
- [ ] Integration: status filter returns correct subset.
- [ ] Integration: date + userId filters work together.
- [ ] Integration: detail includes user email/username.
- [ ] Web RTL: filters, table, detail modal.
- [ ] `npm run lint`, `npm run check-types` clean.

### Manual (MCP: browser)

- [ ] Create mock Pix payment → appears in PENDING filter.
- [ ] Simulate approval → status updates in list.
- [ ] Detail shows user info and payment metadata.

### Success criteria

Admin Pix monitor is complete when admin can list/filter/view Pix payments, UI is wired in admin nav, tests green, and API docs updated.

**Depends on:** nothing (can ship before or after plan 07).
