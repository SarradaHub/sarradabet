# Action Plan 01 — Social Authentication Setup

## 1. Goal

Implement OAuth social login (Google and Facebook) for the SarradaBet Express API + Vite React SPA, linking external accounts to existing users and issuing the same JWT access token + HttpOnly refresh cookie flow used by password auth.

## 2. Market Research / Requirements

### Brazilian and global iGaming context

| Provider | Adoption in betting/iGaming | Regulatory fit | Recommendation |
|----------|----------------------------|----------------|----------------|
| **Google** | Highest global SSO adoption; default on most regulated sportsbook login screens | Widely accepted; strong identity signals | **Phase 1 — primary** |
| **Facebook (Meta)** | Very high in Brazil (~90M+ MAU); common on Brazilian betting apps | Standard OAuth; age gating via provider ToS | **Phase 1 — primary** |
| **Apple ID** | Required for iOS App Store apps with third-party login | Strong privacy; mandatory if mobile app ships | **Phase 2** (Feature 06 mobile) |
| **X (Twitter)** | Niche; higher among esports/crypto demographics | Lower trust for financial-adjacent products | Optional / defer |
| **Twitch** | High in esports streaming audience | Not standard for championship coin betting | Optional / defer |

### Recommendation

Ship **Google + Facebook** first. They cover the vast majority of Brazilian and global betting users, satisfy common regulatory expectations for verified identity providers, and integrate cleanly with Express OAuth libraries. Defer Apple until the React Native mobile app (Feature 06). Do not prioritize Twitch/X unless product explicitly targets esports-only users.

### Stack note

The original prompt suggested `next-auth` (Auth.js). **SarradaBet is not Next.js** — it uses Express + Vite React. Do **not** introduce Auth.js without a framework migration. Use Express-native OAuth (`arctic` or `passport`) and reuse existing [`AuthService`](../../apps/api/src/modules/auth/services/AuthService.ts) token issuance.

## 3. Tech Stack & Dependencies

| Package | Workspace | Purpose |
|---------|-----------|---------|
| `arctic` | `apps/api` | Lightweight OAuth 2.0 for Google, Facebook |
| `zod` | `apps/api` | Validate callback params, provider enum |
| `@sarradabet/types` | `packages/types` | Shared `OAuthProvider`, linked-account DTOs |
| Prisma | `apps/api` | `OAuthAccount` model migration |
| Existing `AuthService` | `apps/api` | Issue JWT + refresh cookie after OAuth success |
| React components | `apps/web` | Social login buttons on Login/Register pages |

**Environment variables** (`apps/api/.env.example`):

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/oauth/google/callback

FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_CALLBACK_URL=http://localhost:8000/api/v1/auth/oauth/facebook/callback

OAUTH_FRONTEND_SUCCESS_URL=http://localhost:3002/oauth/callback
OAUTH_FRONTEND_ERROR_URL=http://localhost:3002/login?error=oauth
```

## 4. MCPs to Utilize

| MCP | Cursor mapping | When to use |
|-----|----------------|-------------|
| `@modelcontextprotocol/server-filesystem` | Built-in Read/Write/StrReplace | Read/write API modules, web pages, Prisma schema, tests |
| `@modelcontextprotocol/server-git` | Shell `git` | Create branch `feature/social-login`, commit per Conventional Commits |
| `@modelcontextprotocol/server-browser` | `cursor-ide-browser` | Verify login buttons, OAuth redirect flow in dev |
| `@modelcontextprotocol/server-github` | `gh` CLI (if available) | Reference OAuth integration patterns in similar repos |
| `@modelcontextprotocol/server-postgres` | `plugin-supabase-supabase` `execute_sql` / Prisma CLI | Verify `oauth_accounts` table after migration |

## 5. Engineering Rules

### TDD

- Write failing unit tests for `OAuthService.linkOrCreateUser()` before implementation.
- Write failing integration tests for `GET /auth/oauth/:provider/callback` (happy path, invalid state, duplicate email) before wiring routes.
- Web: RTL test that Google/Facebook buttons render and trigger redirect URL.

### Clean Code

- Thin `OAuthController`; all provider-specific logic in `GoogleOAuthAdapter` / `FacebookOAuthAdapter` implementing a shared `OAuthProviderStrategy` interface.
- No OAuth secrets in frontend; only API-initiated redirects.
- Keep password optional on `User` for social-only accounts.

### Design Patterns

- **Strategy/Adapter**: one adapter per OAuth provider behind `OAuthProviderStrategy`.
- **Repository → Service → Controller → Routes**: match existing auth module layout.
- **Factory**: `createOAuthProvider(provider: OAuthProvider)` returns the correct adapter.

### Best Practices

- CSRF protection via signed `state` parameter stored in short-lived cookie or Redis.
- Validate provider enum; reject unknown providers with 404.
- Link by email when account exists (prompt user to confirm if email matches existing password account — optional phase 2).
- Update [`docs/API.md`](../API.md) and [`packages/types`](../../packages/types/src/user.ts) when adding endpoints.
- Run `npm run lint`, `npm run check-types`, `npm run test:api:integration` before done.

## 6. Step-by-Step Implementation Checklist

### Phase A — Schema & types

- [ ] **MCP: filesystem** — Read [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma) and [`packages/types/src/user.ts`](../../packages/types/src/user.ts).
- [ ] **MCP: filesystem** — Add `OAuthAccount` model:

```prisma
model OAuthAccount {
  id                Int      @id @default(autoincrement())
  provider          String
  providerAccountId String   @map("provider_account_id")
  userId            Int      @map("user_id")
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt         DateTime @default(now()) @map("created_at")

  @@unique([provider, providerAccountId])
  @@map("oauth_accounts")
}
```

- [ ] Make `User.passwordHash` optional (`String?`) for social-only users.
- [ ] **MCP: filesystem** — Add shared types: `OAuthProvider = "google" | "facebook"`.
- [ ] Run `npm run prisma:migrate:dev -- --name add_oauth_accounts`.
- [ ] **MCP: supabase/postgres** — Verify table exists.

### Phase B — API (TDD)

- [ ] **MCP: git** — Branch: `feature/social-login`.
- [ ] **MCP: filesystem** — Install `arctic` in `apps/api`.
- [ ] **Write test first**: `apps/api/src/modules/auth/__tests__/OAuthService.test.ts` — link existing user, create new user, reject invalid provider.
- [ ] **Write test first**: `apps/api/src/__tests__/integration/oauth.routes.test.ts` — mock provider token exchange; assert JWT + cookie set.
- [ ] **MCP: filesystem** — Create `OAuthProviderStrategy` interface + `GoogleOAuthAdapter`, `FacebookOAuthAdapter`.
- [ ] **MCP: filesystem** — Create `OAuthService` with `linkOrCreateUser(profile)` calling existing `AuthService` for token issuance.
- [ ] **MCP: filesystem** — Create `OAuthController` with:
  - `GET /api/v1/auth/oauth/:provider` — redirect to provider
  - `GET /api/v1/auth/oauth/:provider/callback` — handle callback, redirect to frontend with token or set cookie
- [ ] **MCP: filesystem** — Register routes in [`auth.routes.ts`](../../apps/api/src/modules/auth/routes/auth.routes.ts).
- [ ] **MCP: filesystem** — Update `apps/api/.env.example` with OAuth vars.
- [ ] Run tests → green → refactor.

### Phase C — Frontend

- [ ] **Write test first**: `apps/web/src/pages/__tests__/LoginPage.test.tsx` — social buttons present.
- [ ] **MCP: filesystem** — Add `SocialLoginButtons` component (Google, Facebook) to [`LoginPage.tsx`](../../apps/web/src/pages/LoginPage.tsx) and [`RegisterPage.tsx`](../../apps/web/src/pages/RegisterPage.tsx).
- [ ] Buttons link to `GET /api/v1/auth/oauth/google` (via proxy or `VITE_API_URL`).
- [ ] **MCP: filesystem** — Add `/oauth/callback` route in [`App.tsx`](../../apps/web/src/App.tsx) to capture token from redirect and call `AuthProvider.loginWithToken()` (or rely on HttpOnly cookie refresh).
- [ ] **MCP: browser** — Manual verify redirect flow in dev with real provider credentials.

### Phase D — Documentation

- [ ] **MCP: filesystem** — Update [`docs/API.md`](../API.md) with OAuth endpoints.
- [ ] **MCP: filesystem** — Update [`docs/features/01-user-auth-and-crud.md`](../features/01-user-auth-and-crud.md) status note.

## 7. UI/UX Implementation Details

- Place social buttons **above** the email/password form divider ("ou continue com").
- Use provider brand guidelines (Google multicolor G, Facebook blue).
- Show loading state while redirecting; disable buttons during redirect.
- On OAuth error, redirect to `/login?error=oauth` with user-friendly PT message: "Não foi possível entrar com esta conta. Tente novamente ou use email e senha."
- Do not expose Client Secrets in the web bundle — only public redirect URLs.

## 8. Code Snippets / Pseudo-code

### OAuthProviderStrategy interface

```typescript
// apps/api/src/modules/auth/oauth/OAuthProviderStrategy.ts
export interface OAuthProfile {
  provider: "google" | "facebook";
  providerAccountId: string;
  email: string;
  name?: string;
}

export interface OAuthProviderStrategy {
  getAuthorizationUrl(state: string): URL;
  validateCallback(code: string): Promise<OAuthProfile>;
}
```

### OAuthService link-or-create

```typescript
// apps/api/src/modules/auth/services/OAuthService.ts
async linkOrCreateUser(profile: OAuthProfile): Promise<AuthTokens> {
  const existing = await this.oauthRepo.findByProvider(profile);
  if (existing) return this.authService.issueTokens(existing.userId);

  const userByEmail = await this.userRepo.findByEmail(profile.email);
  if (userByEmail) {
    await this.oauthRepo.link(userByEmail.id, profile);
    return this.authService.issueTokens(userByEmail.id);
  }

  const user = await this.userRepo.createFromOAuth(profile);
  await this.oauthRepo.link(user.id, profile);
  return this.authService.issueTokens(user.id);
}
```

### Social login button (web)

```tsx
// apps/web/src/components/auth/SocialLoginButtons.tsx
const providers = [
  { id: "google", label: "Continuar com Google", href: "/api/v1/auth/oauth/google" },
  { id: "facebook", label: "Continuar com Facebook", href: "/api/v1/auth/oauth/facebook" },
];

export function SocialLoginButtons() {
  return (
    <div className="flex flex-col gap-2">
      {providers.map((p) => (
        <a key={p.id} href={p.href} className="btn-oauth">{p.label}</a>
      ))}
    </div>
  );
}
```

## 9. Testing & Success Criteria

### Automated

- [ ] `OAuthService` unit tests pass (link, create, duplicate provider account).
- [ ] Integration tests pass for OAuth callback with mocked provider.
- [ ] Login page RTL tests pass for social buttons.
- [ ] `npm run lint` and `npm run check-types` clean.

### Manual (MCP: browser)

- [ ] Click "Continuar com Google" → Google consent → redirected back → logged in with JWT.
- [ ] Same for Facebook.
- [ ] Existing email user can link OAuth on first social login.
- [ ] Invalid/expired state param returns error redirect, no session created.
- [ ] Non-admin social login does not grant admin access.

### Success criteria

Social login is complete when Google and Facebook OAuth work end-to-end in local dev, tests are green, API docs updated, and no secrets are committed.
