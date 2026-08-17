# Action Plan 11 — Mobile Coins and Dashboard

## 1. Goal

Add mobile screens for buying coins via Pix (QR code / copia e cola) and viewing the user dashboard from `GET /api/v1/users/me/dashboard`.

## 2. Market Research / Requirements

Feature 06 Part 2 (Pix purchase + dashboard) in [Feature 06](../features/06-mobile-app-and-admin-panel.md).

**Existing API (shipped):**

- `GET /coin-packages` — list packages
- `POST /payments/pix` — create Pix payment → QR + copy-paste
- `GET /payments/pix/:id` — poll status
- `GET /users/me/dashboard` — balance, stats, recent history
- Socket.io `payment:confirmed` → user room (alternative to polling)

**Depends on:** plan 10 (`apps/mobile`, auth, api-client, RealtimeProvider).

**Out of scope:** Instore QR tab (web has it; mobile can defer), reward redemption, voting UI.

## 3. Tech Stack & Dependencies

| Item | Purpose |
|------|---------|
| `@sarradabet/api-client` | `payments.createPix`, `users.getDashboard`, `coins.listPackages` |
| `@sarradabet/types` | `CreatePixPurchaseResponse`, dashboard DTOs |
| `expo-clipboard` | Copy Pix copia e cola |
| React Native `Image` | Display QR from base64 |
| Existing `RealtimeProvider` | Listen for `payment:confirmed` |

## 4. MCPs to Utilize

| MCP | Cursor mapping | When to use |
|-----|----------------|-------------|
| `@modelcontextprotocol/server-filesystem` | Built-in Read/Write | Screens, hooks, navigation |
| `@modelcontextprotocol/server-git` | Shell `git` | Branch `feature/mobile-coins-dashboard` |
| `@modelcontextprotocol/server-browser` | Manual / Expo | Test Pix flow with `MERCADOPAGO_MOCK_PIX=true` |

## 5. Engineering Rules

### TDD

- Unit test: dashboard hook maps API response to display fields.
- Unit test: Pix status polling stops on APPROVED/EXPIRED.
- Manual QA: mock Pix approval updates balance.

### Clean Code

- Separate hooks: `useCoinPackages`, `usePixPayment`, `useDashboard`.
- Pix flow state machine: `idle → creating → pending → confirmed | expired | failed`.
- Reuse financial disclaimer acknowledgment pattern from web if required (see plan 04).

### Design Patterns

- **State machine** for payment status UI.
- **Polling with cleanup**: `useEffect` interval cleared on unmount or terminal status.

### Best Practices

- Show coin balance prominently; refresh dashboard after payment confirmed.
- Handle `MERCADOPAGO_MOCK_PIX` dev flow (simulate approval button or auto-approve).
- Portuguese labels throughout.
- Run `npm run lint`, `npm run check-types`.

## 6. Step-by-Step Implementation Checklist

### Phase A — Navigation updates

- [ ] **MCP: git** — Branch `feature/mobile-coins-dashboard`.
- [ ] **MCP: filesystem** — Add tabs or stack screens:
  - `CoinsScreen` — purchase flow
  - Replace `ProfileScreen` stub with `DashboardScreen` (or split Profile + Dashboard)
- [ ] **MCP: filesystem** — Update tab bar icons/labels: "Moedas", "Perfil".

### Phase B — Coin packages + Pix purchase

- [ ] **MCP: filesystem** — Extend api-client if needed: `coins.listPackages()`, `payments.createPix()`, `payments.getPixStatus()`.
- [ ] **MCP: filesystem** — Create `useCoinPackages.ts`.
- [ ] **MCP: filesystem** — Create `CoinsScreen.tsx`:
  - List packages (name, coins, price)
  - "Comprar com PIX" button per package
  - On purchase → navigate to `PixPaymentScreen` or inline modal
- [ ] **MCP: filesystem** — Create `PixPaymentScreen.tsx` / modal:
  - Display QR (`qrCodeBase64` as `data:image/png;base64,...`)
  - Copy-paste code button (`expo-clipboard`)
  - Status indicator (PENDING → APPROVED)
  - Poll `GET /payments/pix/:id` every 3s OR listen `payment:confirmed` via RealtimeProvider
  - On confirmed → toast + navigate to dashboard with refreshed balance

### Phase C — Dashboard

- [ ] **MCP: filesystem** — Extend api-client: `users.getDashboard()`.
- [ ] **MCP: filesystem** — Create `useDashboard.ts`.
- [ ] **MCP: filesystem** — Create `DashboardScreen.tsx` displaying:
  - Saldo de moedas
  - Total de apostas
  - Taxa de vitórias (%)
  - Posição no ranking
  - Histórico recente (apostas + transações)
- [ ] Pull-to-refresh on dashboard.

### Phase D — Realtime integration

- [ ] **MCP: filesystem** — Extend `RealtimeProvider` to handle `payment:confirmed`:
  - Invalidate/refetch dashboard balance
  - Update Pix payment screen if active

### Phase E — Documentation

- [ ] **MCP: filesystem** — Update `apps/mobile/README.md` with Pix testing notes (`MERCADOPAGO_MOCK_PIX`, ngrok).
- [ ] **MCP: filesystem** — Check off Feature 06 mobile coins/dashboard items.

## 7. UI/UX Implementation Details

- Package cards: coins amount large, price in BRL below.
- Pix screen: countdown to `expiresAt` if pending.
- Success state: green checkmark + "100 moedas adicionadas!"
- Dashboard stats in grid (2 columns on phone).
- Recent history: compact list with icon per type (bet, payment, reward).
- Empty history: "Nenhuma atividade recente".

## 8. Code Snippets / Pseudo-code

### Pix polling hook

```typescript
export function usePixPaymentStatus(paymentId: number | null) {
  const [status, setStatus] = useState<PixPaymentStatus | null>(null);

  useEffect(() => {
    if (!paymentId) return;
    let cancelled = false;

    const poll = async () => {
      const res = await client.payments.getPixStatus(paymentId);
      if (cancelled) return;
      setStatus(res.status);
      if (res.status === "PENDING") {
        setTimeout(poll, 3000);
      }
    };

    void poll();
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  return status;
}
```

### Dashboard layout

```tsx
<View style={styles.statsGrid}>
  <StatCard label="Saldo" value={`${dashboard.coinBalance} moedas`} />
  <StatCard label="Apostas" value={String(dashboard.totalBets)} />
  <StatCard label="Vitórias" value={`${dashboard.winRate}%`} />
  <StatCard label="Ranking" value={`#${dashboard.leaderboardRank}`} />
</View>
<RecentActivityList items={dashboard.recentActivity} />
```

## 9. Testing & Success Criteria

### Automated

- [ ] Unit: polling stops on terminal status.
- [ ] Unit: dashboard hook maps fields correctly.
- [ ] `npm run lint`, `npm run check-types` clean.

### Manual QA

- [ ] Select package → Pix QR displayed.
- [ ] Copy-paste code copies to clipboard.
- [ ] Mock approval → balance updates on dashboard.
- [ ] Dashboard shows correct stats for test user.
- [ ] Pull-to-refresh reloads data.

### Success criteria

Mobile coins and dashboard are complete when users can purchase coins via Pix on mobile, monitor payment status, and view their dashboard with live balance updates.

**Depends on:** plan 10.
