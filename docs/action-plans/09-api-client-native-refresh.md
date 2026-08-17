# Action Plan 09 — Native Refresh and `@sarradabet/api-client`

## 1. Goal

Unblock React Native auth without breaking the web HttpOnly cookie refresh flow, and create a shared `@sarradabet/api-client` package with typed endpoints, automatic 401 refresh retry, and Socket.io factory. **Do not migrate web** off [`apps/web/src/services/apiClient.ts`](../../apps/web/src/services/apiClient.ts) in this plan.

## 2. Market Research / Requirements

Feature 06 Part 1 (mobile auth) and monorepo layout in [Feature 06](../features/06-mobile-app-and-admin-panel.md).

**Problem:** Today refresh works **cookie-only**:

```typescript
// AuthController.refresh — reads req.cookies only
const refreshToken = req.cookies?.[config.REFRESH_TOKEN_COOKIE_NAME];
```

HttpOnly cookies do not work reliably on React Native. Mobile needs refresh via header or body.

**Chosen approach (document in `apps/mobile/README.md` when plan 10 ships):**

1. Keep HttpOnly cookie refresh for web (unchanged default).
2. On login/register, also return `refreshToken` in JSON when client sends `X-Client: mobile` header (or `client: "mobile"` in body).
3. `POST /auth/refresh` accepts refresh from, in order: cookie → `Authorization: Bearer <refresh>` → body `{ refreshToken }`.
4. `POST /auth/logout` accepts the same refresh sources for revocation.

**Out of scope:** Migrating web to api-client; Apple Sign In; OAuth (plan 01).

## 3. Tech Stack & Dependencies

| Item | Path / package | Purpose |
|------|----------------|---------|
| `@sarradabet/api-client` | `packages/api-client/` (new) | Typed fetch, refresh, Socket factory |
| `@sarradabet/types` | `packages/types` | Shared DTOs |
| Auth module | `apps/api/src/modules/auth/` | Multi-source refresh |
| `socket.io-client` | api-client peer dep | Realtime factory |
| Vitest | `packages/api-client` | Unit tests for refresh retry |
| Jest + Supertest | `apps/api` | Auth refresh integration tests |

## 4. MCPs to Utilize

| MCP | Cursor mapping | When to use |
|-----|----------------|-------------|
| `@modelcontextprotocol/server-filesystem` | Built-in Read/Write | Package scaffold, auth changes, tests |
| `@modelcontextprotocol/server-git` | Shell `git` | Branch `feature/api-client-native-refresh` |
| `@modelcontextprotocol/server-postgres` | Prisma CLI | Verify refresh token rotation still works |

## 5. Engineering Rules

### TDD

- Write failing API test: refresh with `Authorization: Bearer <refreshToken>` → 200 + new accessToken.
- Write failing API test: refresh with body `{ refreshToken }` → 200.
- Write failing API test: web cookie refresh still works (regression).
- Write failing API test: login with `X-Client: mobile` → response includes `refreshToken`.
- Write failing unit test: api-client retries original request after 401 refresh.

### Clean Code

- Extract `getRefreshTokenFromRequest(req)` helper in auth controller — single source for cookie/header/body.
- api-client: single-flight refresh (one in-flight refresh promise shared across concurrent 401s).
- No axios in api-client — use native `fetch` for RN compatibility.

### Design Patterns

- **Factory**: `createApiClient(config)` returns typed client instance.
- **Strategy**: token storage injected via config (`getAccessToken`, `setAccessToken`, `getRefreshToken`, etc.).
- **Adapter**: Socket factory wraps `socket.io-client` with auth token.

### Best Practices

- Never log refresh tokens.
- Rotate refresh tokens on each refresh (existing behavior — preserve).
- Update [`docs/API.md`](../API.md) auth section with mobile client notes.
- Add `packages/api-client` to root workspaces (auto via `packages/*`).
- Run `npm run lint`, `npm run check-types`, targeted tests.

## 6. Step-by-Step Implementation Checklist

### Phase A — API auth changes (TDD first)

- [ ] **MCP: git** — Branch `feature/api-client-native-refresh`.
- [ ] **Write test first**: `apps/api/src/__tests__/integration/auth.refresh.mobile.test.ts`:
  - Cookie refresh (existing — regression)
  - Header Bearer refresh
  - Body `{ refreshToken }` refresh
  - Login with `X-Client: mobile` includes `refreshToken` in JSON
  - Logout revokes via header/body refresh
- [ ] **MCP: filesystem** — Add helper in [`AuthController.ts`](../../apps/api/src/modules/auth/controllers/AuthController.ts):

```typescript
private getRefreshTokenFromRequest(req: Request): string | undefined {
  return (
    req.cookies?.[config.REFRESH_TOKEN_COOKIE_NAME] ??
    req.headers.authorization?.replace(/^Bearer\s+/i, "") ??
    (req.body as { refreshToken?: string })?.refreshToken
  );
}
```

- [ ] **MCP: filesystem** — Extend login/register responses when `X-Client: mobile`:

```typescript
// AuthTokensResponse extended for mobile
export interface AuthTokensResponse {
  user: UserPublic;
  accessToken: { token: string; expiresIn: string };
  refreshToken?: { token: string; expiresIn: string }; // mobile only
}
```

- [ ] **MCP: filesystem** — Update logout to use same helper.
- [ ] Run API tests → green.

### Phase B — `@sarradabet/api-client` package

- [ ] **MCP: filesystem** — Create `packages/api-client/`:

```
packages/api-client/
├── package.json          # name: @sarradabet/api-client
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts
    ├── client.ts         # createApiClient, fetch wrapper, 401 retry
    ├── auth.ts           # login, register, refresh, logout
    ├── bets.ts
    ├── coins.ts
    ├── payments.ts
    ├── users.ts
    ├── socket.ts         # createSocketClient
    └── types.ts          # ApiClientConfig, TokenStorage
```

- [ ] **MCP: filesystem** — `ApiClientConfig`:

```typescript
export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  setAccessToken(token: string): Promise<void>;
  clearAccessToken(): Promise<void>;
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string): Promise<void>;
  clearRefreshToken(): Promise<void>;
}

export interface ApiClientConfig {
  baseUrl: string;
  storage: TokenStorage;
  clientHeader?: "mobile" | "web";
  onAuthError?: () => void;
}
```

- [ ] **MCP: filesystem** — Implement single-flight refresh in `client.ts`:

```typescript
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(config: ApiClientConfig): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = doRefresh(config).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}
```

- [ ] **MCP: filesystem** — Typed methods using `@sarradabet/types` DTOs.
- [ ] **MCP: filesystem** — `createSocketClient({ url, getAccessToken })` with `auth: { token }`.
- [ ] **Write unit tests**: refresh retry, error propagation, no retry on second 401.
- [ ] Add to root `package.json` scripts if needed: `"test:api-client": "npm run test --workspace=@sarradabet/api-client"`.

### Phase C — Turbo / workspace wiring

- [ ] **MCP: filesystem** — Ensure `packages/api-client/package.json` has `build`, `dev`, `lint`, `check-types`, `test` scripts.
- [ ] **MCP: filesystem** — `turbo.json` picks up tasks automatically via workspace.
- [ ] Run `npm install` at root to link workspace.

### Phase D — Documentation

- [ ] **MCP: filesystem** — Update [`docs/API.md`](../API.md) auth section (mobile refresh sources, `X-Client: mobile`).
- [ ] **MCP: filesystem** — Add brief README in `packages/api-client/README.md` (usage example).
- [ ] **MCP: filesystem** — Note in Feature 06 that cookie-only refresh is resolved by this plan.

## 7. UI/UX Implementation Details

Not applicable — backend + shared package only. Mobile UI comes in plan 10.

## 8. Code Snippets / Pseudo-code

### api-client fetch wrapper

```typescript
export async function apiFetch<T>(
  config: ApiClientConfig,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const accessToken = await config.storage.getAccessToken();
  const headers = new Headers(init.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (config.clientHeader === "mobile") headers.set("X-Client", "mobile");

  let res = await fetch(`${config.baseUrl}${path}`, { ...init, headers });

  if (res.status === 401 && !init.headers?.["X-Retry"]) {
    const newToken = await refreshAccessToken(config);
    headers.set("Authorization", `Bearer ${newToken}`);
    headers.set("X-Retry", "1");
    res = await fetch(`${config.baseUrl}${path}`, { ...init, headers });
  }

  if (!res.ok) throw await parseApiError(res);
  return res.json();
}
```

### Socket factory

```typescript
export function createSocketClient(options: {
  url: string;
  getAccessToken: () => Promise<string | null>;
}) {
  const socket = io(options.url, {
    autoConnect: false,
    auth: async (cb) => {
      const token = await options.getAccessToken();
      cb({ token: token ?? undefined });
    },
  });
  return socket;
}
```

## 9. Testing & Success Criteria

### Automated

- [ ] API integration: cookie, header, and body refresh paths.
- [ ] API integration: mobile login returns refreshToken in JSON.
- [ ] API integration: web login does **not** expose refreshToken (unless mobile header).
- [ ] Unit: api-client 401 → refresh → retry succeeds.
- [ ] Unit: concurrent 401s share single refresh call.
- [ ] `npm run lint`, `npm run check-types` clean.

### Manual

- [ ] curl refresh with Bearer refresh token works.
- [ ] Existing web login/refresh/logout unchanged.

### Success criteria

Native refresh and api-client are complete when mobile clients can authenticate and auto-refresh without cookies, web auth is unchanged, package is typed and tested, and API docs updated.

**Depends on:** nothing. **Blocks:** plan 10 (mobile core).
