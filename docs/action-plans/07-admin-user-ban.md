# Action Plan 07 — Admin User Ban and Search

## 1. Goal

Add paginated admin user listing with search, ban/unban with reason and audit trail, and middleware that blocks banned users (403) on all authenticated routes. Coin adjust stays as shipped in [03-admin-coin-management.md](./03-admin-coin-management.md).

## 2. Market Research / Requirements

Not applicable — internal admin capability. Specified in [Feature 06 Part 4, 8, 9](../features/06-mobile-app-and-admin-panel.md):

- `GET /api/v1/admin/users` — paginated list with `search` (email/username, case-insensitive)
- `PATCH /api/v1/admin/users/:id/ban` — `{ isBanned, reason? }`
- Banned users receive **403** on authenticated routes with message `"Usuário banido"`
- Admin cannot ban themselves
- Audit log for `BAN` / `UNBAN` actions

**Current state:**

- [`AdminUsersPage.tsx`](../../apps/web/src/pages/AdminUsersPage.tsx) lists all users via `GET /users` (no search, no ban)
- [`UserService.findAll()`](../../apps/api/src/modules/user/services/UserService.ts) returns full list without pagination
- `User` model has no `isBanned` fields
- [`AuthMiddleware`](../../apps/api/src/core/middleware/AuthMiddleware.ts) has no ban check

**Out of scope:** Pix monitor (plan 08), `SUPER_ADMIN` tier, removing delete-user flow.

## 3. Tech Stack & Dependencies

| Item | Path / package | Purpose |
|------|----------------|---------|
| Prisma | `apps/api/prisma/schema.prisma` | `User.isBanned`, `bannedAt`, `bannedReason` |
| `AdminAuditLog` | existing model | `BAN` / `UNBAN` audit rows |
| `AuthMiddleware` | `apps/api/src/core/middleware/AuthMiddleware.ts` | Ban check after JWT verify |
| Zod | `ValidationSchemas.ts` | `BanUserSchema`, `AdminUsersQuerySchema` |
| `@sarradabet/types` | `packages/types/src/user.ts` | Admin list DTOs, ban request/response |
| Admin UI | `AdminUsersPage`, new `BanUserModal` | Search, ban/unban |
| Jest + Supertest | `apps/api/src/__tests__/integration/` | Integration tests |

## 4. MCPs to Utilize

| MCP | Cursor mapping | When to use |
|-----|----------------|-------------|
| `@modelcontextprotocol/server-filesystem` | Built-in Read/Write | Schema, services, routes, admin UI, tests |
| `@modelcontextprotocol/server-git` | Shell `git` | Branch `feature/admin-user-ban` |
| `@modelcontextprotocol/server-postgres` | `plugin-supabase-supabase` / Prisma CLI | Verify migration, query ban flags |
| `@modelcontextprotocol/server-browser` | `cursor-ide-browser` | Test ban flow in admin UI |

## 5. Engineering Rules

### TDD

- Write failing integration test: `GET /admin/users` → 403 for USER role before route exists.
- Write failing test: ban user → `isBanned=true`, `bannedAt` set, audit log created.
- Write failing test: banned user → 403 on `GET /users/me`.
- Write failing test: admin cannot ban self → 400.
- Web: RTL test for search input and ban modal validation (reason required when banning).

### Clean Code

- Controller validates only; `AdminUserService.banUser()` / `listUsers()` own business rules.
- Extend existing [`admin.users.routes.ts`](../../apps/api/src/modules/admin/routes/admin.users.routes.ts) — do not duplicate coin adjust routes.
- Ban check in middleware: after JWT verify, load `isBanned` (DB or short Redis cache keyed by `userId`).

### Design Patterns

- **Repository → Service → Controller → Routes** (existing Clean Architecture).
- **RBAC middleware** chain: `authenticateUser` → `requireUserRole(UserRole.ADMIN)`.
- **Audit trail** via existing `AdminAuditLogRepository`.

### Best Practices

- When unbanning, clear `bannedAt` and `bannedReason` (set to `null`).
- Reason required when `isBanned: true` (min 3 chars).
- Optionally reject banning the last remaining admin (count `role=ADMIN` where `isBanned=false`).
- Update [`docs/API.md`](../API.md) and `@sarradabet/types`.
- Run `npm run lint`, `npm run check-types`, `npm run test:api:integration`.

## 6. Step-by-Step Implementation Checklist

### Phase A — Schema & types

- [ ] **MCP: filesystem** — Read [`schema.prisma`](../../apps/api/prisma/schema.prisma), [`user.ts`](../../packages/types/src/user.ts).
- [ ] **MCP: filesystem** — Add to `User` model:

```prisma
isBanned     Boolean   @default(false) @map("is_banned")
bannedAt     DateTime? @map("banned_at")
bannedReason String?   @map("banned_reason")
```

- [ ] **MCP: filesystem** — Add shared types:

```typescript
export interface AdminUserListItem extends UserPublic {
  isBanned: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
}

export interface AdminUsersListResponse {
  items: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BanUserRequest {
  isBanned: boolean;
  reason?: string;
}
```

- [ ] Run `npm run prisma:migrate:dev -- --name add_user_ban_fields`.
- [ ] **MCP: postgres** — Verify columns on `users`.

### Phase B — API (TDD: tests first)

- [ ] **MCP: git** — Branch `feature/admin-user-ban`.
- [ ] **Write test first**: `apps/api/src/__tests__/integration/admin.users.ban.test.ts`:
  - 401 without auth on `GET /admin/users`
  - 403 as USER role
  - 200 paginated list with search filter
  - 200 ban with reason → fields updated + audit log
  - 200 unban → fields cleared
  - 403 banned user on authenticated route
  - 400 admin banning self
- [ ] **MCP: filesystem** — Add Zod schemas: `AdminUsersQuerySchema`, `BanUserSchema`.
- [ ] **MCP: filesystem** — Create `AdminUserRepository` (paginated find with search).
- [ ] **MCP: filesystem** — Create `AdminUserService.listUsers()` and `AdminUserService.banUser()`.
- [ ] **MCP: filesystem** — Create `AdminUserController`.
- [ ] **MCP: filesystem** — Extend [`admin.users.routes.ts`](../../apps/api/src/modules/admin/routes/admin.users.routes.ts):

```
GET  /api/v1/admin/users          — list (paginated + search)
PATCH /api/v1/admin/users/:id/ban — ban/unban
POST /api/v1/admin/users/:id/coins/adjust — existing (unchanged)
```

- [ ] **MCP: filesystem** — Add ban check to `authenticateUser` in [`AuthMiddleware.ts`](../../apps/api/src/core/middleware/AuthMiddleware.ts):

```typescript
if (user.isBanned) {
  throw new ForbiddenError("Usuário banido");
}
```

- [ ] Run tests → green → refactor.

### Phase C — Admin UI

- [ ] **Write test first**: RTL tests for search debounce and ban modal.
- [ ] **MCP: filesystem** — Add `adminUserService.listUsers({ page, limit, search })` and `banUser(id, dto)` in web services.
- [ ] **MCP: filesystem** — Create `BanUserModal.tsx` (reason textarea when banning; confirm unban).
- [ ] **MCP: filesystem** — Extend [`AdminUsersPage.tsx`](../../apps/web/src/pages/AdminUsersPage.tsx):
  - Search input with debounced query
  - Pagination controls
  - `isBanned` badge per row
  - Ban/unban action button
  - Switch from `GET /users` to `GET /admin/users`
- [ ] **MCP: browser** — Admin login → Users → search → ban → verify 403 as banned user.

### Phase D — Documentation

- [ ] **MCP: filesystem** — Update [`docs/API.md`](../API.md) with new admin user endpoints.
- [ ] **MCP: filesystem** — Check off ban/search items in Feature 06 checklist; remove from ROADMAP when shipped.

## 7. UI/UX Implementation Details

- Search placeholder: "Buscar por email ou nome de usuário".
- Banned users: red badge "Banido" with tooltip showing reason and date.
- Ban modal: require reason (min 3 chars); confirm dialog for unban.
- Pagination: show "Página X de Y" with prev/next buttons.
- Portuguese labels: "Banir usuário", "Desbanir", "Motivo do banimento".

## 8. Code Snippets / Pseudo-code

### AdminUserService.banUser

```typescript
async banUser(adminId: number, targetUserId: number, dto: BanUserRequest) {
  if (adminId === targetUserId) {
    throw new BadRequestError("Não é possível banir a si mesmo");
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: targetUserId },
      data: dto.isBanned
        ? { isBanned: true, bannedAt: new Date(), bannedReason: dto.reason }
        : { isBanned: false, bannedAt: null, bannedReason: null },
    });

    await this.auditRepo.create(tx, {
      adminId,
      action: dto.isBanned ? "BAN" : "UNBAN",
      targetUserId,
      payload: { reason: dto.reason ?? null },
    });

    return user;
  });
}
```

### Paginated list query

```typescript
const where = search
  ? {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ],
    }
  : {};

const [items, total] = await Promise.all([
  prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
  prisma.user.count({ where }),
]);
```

## 9. Testing & Success Criteria

### Automated

- [ ] Integration: 403 for non-admin, 401 unauthenticated.
- [ ] Integration: ban sets fields; unban clears them.
- [ ] Integration: banned user gets 403 on any authenticated route.
- [ ] Integration: self-ban rejected with 400.
- [ ] Integration: `AdminAuditLog` row for BAN/UNBAN.
- [ ] Web RTL: search, ban modal validation.
- [ ] `npm run lint`, `npm run check-types` clean.

### Manual (MCP: browser)

- [ ] Admin searches user by email → filtered list.
- [ ] Admin bans user with reason → badge appears.
- [ ] Banned user cannot access profile or vote.
- [ ] Admin unbans user → user can log in again.

### Success criteria

Admin user ban and search is complete when paginated admin list works, ban/unban is audited, banned users are blocked with 403, UI is functional, tests green, and API docs updated.
