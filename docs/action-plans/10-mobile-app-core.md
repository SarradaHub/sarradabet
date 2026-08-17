# Action Plan 10 — Expo Mobile App Core

## 1. Goal

Create `apps/mobile` (Expo + TypeScript) with login/register/logout, bet list with live odds via Socket.io, and basic navigation. Uses `@sarradabet/api-client` and `@sarradabet/types` from plan 09.

## 2. Market Research / Requirements

Feature 06 Part 1 (auth), Part 2 (bet list + live odds), Part 9 (offline) in [Feature 06](../features/06-mobile-app-and-admin-panel.md).

**Current state:**

- `apps/mobile` does not exist
- Web patterns: custom hooks, Socket.io via [`useSocket.ts`](../../apps/web/src/core/hooks/useSocket.ts)
- Bet list API: `GET /api/v1/bets`; realtime: `vote:created`, `bet:created`, `bet:updated`

**Out of scope (later plans):** Pix purchase (plan 11), dashboard stats (plan 11), push (plan 12), Apple Sign In, vote placement UI (optional stretch).

## 3. Tech Stack & Dependencies

| Package | Purpose |
|---------|---------|
| Expo SDK (latest stable) | React Native scaffold |
| `@sarradabet/api-client` | API + Socket (plan 09) |
| `@sarradabet/types` | Shared DTOs |
| `@react-navigation/native` + stack/tabs | Navigation |
| `@react-native-async-storage/async-storage` | Access token storage |
| `expo-secure-store` | Refresh token storage |
| `@react-native-community/netinfo` | Offline detection |
| `socket.io-client` | Via api-client factory |
| Expo dev client | Local API testing |

**Environment:**

```env
# apps/mobile/.env.example
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://localhost:8000
```

Use machine IP (not `localhost`) when testing on physical device.

## 4. MCPs to Utilize

| MCP | Cursor mapping | When to use |
|-----|----------------|-------------|
| `@modelcontextprotocol/server-filesystem` | Built-in Read/Write | Scaffold app, screens, navigation |
| `@modelcontextprotocol/server-git` | Shell `git` | Branch `feature/mobile-core` |
| `@modelcontextprotocol/server-browser` | Expo dev tools / manual | Verify login and bet list |

## 5. Engineering Rules

### TDD

- Unit test: `TokenStorage` adapter reads/writes AsyncStorage + SecureStore.
- Unit test: auth context clears tokens on logout.
- Optional: Maestro/Detox smoke for login → home (manual QA checklist acceptable for v1).

### Clean Code

- `AuthProvider` mirrors web pattern but uses api-client + mobile storage.
- Screen components are presentational; data fetching in hooks (`useBets`, `useAuth`).
- Reuse bet list types from `@sarradabet/types` — no duplicate interfaces.

### Design Patterns

- **Provider**: `AuthProvider`, `RealtimeProvider` (Socket connection lifecycle).
- **Composition**: tab navigator (Home, Profile stub) + auth stack (Login, Register).

### Best Practices

- Document refresh approach in `apps/mobile/README.md` (reference plan 09).
- Configure Turbo `dev` task for mobile (`expo start`).
- Run `npm run lint`, `npm run check-types` for mobile workspace.
- Match existing API base path `/api/v1`.

## 6. Step-by-Step Implementation Checklist

### Phase A — Monorepo scaffold

- [ ] **MCP: git** — Branch `feature/mobile-core`.
- [ ] **MCP: filesystem** — `npx create-expo-app apps/mobile --template blank-typescript`.
- [ ] **MCP: filesystem** — Configure `apps/mobile/package.json`:
  - Dependencies: `@sarradabet/api-client`, `@sarradabet/types`, navigation, async-storage, secure-store, netinfo
  - Scripts: `dev`, `lint`, `check-types`, `test`
- [ ] **MCP: filesystem** — `tsconfig.json` paths to workspace packages.
- [ ] **MCP: filesystem** — Add `apps/mobile/.env.example`.
- [ ] Run `npm install` at root.

### Phase B — Auth layer

- [ ] **MCP: filesystem** — Create `src/storage/tokenStorage.ts` implementing api-client `TokenStorage`:
  - Access → AsyncStorage (`@sarradabet/accessToken`)
  - Refresh → SecureStore (`@sarradabet/refreshToken`)
- [ ] **MCP: filesystem** — Create `src/context/AuthProvider.tsx`:
  - `login(email, password)`, `register(...)`, `logout()`
  - Creates api-client with `clientHeader: "mobile"`
  - Exposes `user`, `isAuthenticated`, `isLoading`
- [ ] **MCP: filesystem** — Create screens:
  - `LoginScreen.tsx`
  - `RegisterScreen.tsx`
- [ ] **MCP: filesystem** — Auth stack navigator; redirect to tabs when authenticated.

### Phase C — Bet list + realtime

- [ ] **MCP: filesystem** — Create `src/hooks/useBets.ts` — `GET /bets` via api-client.
- [ ] **MCP: filesystem** — Create `src/context/RealtimeProvider.tsx`:
  - Connect Socket on auth; disconnect on logout
  - Patch bet list on `vote:created`, `bet:updated`, `bet:created`
- [ ] **MCP: filesystem** — Create `HomeScreen.tsx`:
  - FlatList of bets with odds
  - "Ao vivo" indicator for open bets
  - Pull-to-refresh
- [ ] **MCP: filesystem** — Create stub `ProfileScreen.tsx` ("Em breve" or logout button).

### Phase D — Offline handling

- [ ] **MCP: filesystem** — Create `NetworkBanner.tsx` using NetInfo:
  - Show "Sem conexão com a internet" when offline
  - Hide when restored
- [ ] **MCP: filesystem** — api-client: optional retry with exponential backoff for network errors (not 401).

### Phase E — Navigation shell

- [ ] **MCP: filesystem** — Tab navigator: Home, Profile.
- [ ] **MCP: filesystem** — Root: auth stack vs main tabs based on `isAuthenticated`.
- [ ] **MCP: filesystem** — Basic styling (consistent with brand colors; no design-system dependency required for v1).

### Phase F — Documentation

- [ ] **MCP: filesystem** — Create `apps/mobile/README.md` (setup, env, device testing, auth flow).
- [ ] **MCP: filesystem** — Update Feature 06 checklist items for mobile core.

## 7. UI/UX Implementation Details

- Login: email + password fields, "Entrar" button, link to register.
- Home: card per bet — title, category, status badge, odds list with live values.
- Live indicator: pulsing dot or "AO VIVO" label on `status === "open"`.
- Offline banner: fixed top, dismiss not allowed until online.
- Portuguese UI strings (match web).

## 8. Code Snippets / Pseudo-code

### Token storage

```typescript
export const mobileTokenStorage: TokenStorage = {
  async getAccessToken() {
    return AsyncStorage.getItem("accessToken");
  },
  async setAccessToken(token) {
    await AsyncStorage.setItem("accessToken", token);
  },
  async clearAccessToken() {
    await AsyncStorage.removeItem("accessToken");
  },
  async getRefreshToken() {
    return SecureStore.getItemAsync("refreshToken");
  },
  async setRefreshToken(token) {
    await SecureStore.setItemAsync("refreshToken", token);
  },
  async clearRefreshToken() {
    await SecureStore.deleteItemAsync("refreshToken");
  },
};
```

### Realtime bet patch

```typescript
socket.on("vote:created", (payload) => {
  setBets((prev) =>
    prev.map((bet) =>
      bet.id === payload.betId
        ? patchOddStake(bet, payload.oddId, payload.totalStake)
        : bet,
    ),
  );
});
```

## 9. Testing & Success Criteria

### Automated

- [ ] Unit: token storage round-trip.
- [ ] Unit: auth context login/logout state.
- [ ] `npm run lint`, `npm run check-types` clean for mobile workspace.

### Manual QA checklist

- [ ] Register new user on device/simulator.
- [ ] Login → lands on Home with bet list.
- [ ] Place vote from web → odds update on mobile without refresh.
- [ ] Logout → tokens cleared; redirected to login.
- [ ] Airplane mode → offline banner appears.

### Success criteria

Mobile core is complete when Expo app builds, auth works with auto-refresh, bet list loads with live Socket.io updates, offline banner works, and README documents setup.

**Depends on:** plan 09. **Blocks:** plans 11 and 12.
