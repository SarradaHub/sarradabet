# Action Plan 04 — Financial Disclaimers

## 1. Goal

Implement prominent, bilingual (Portuguese primary, English secondary) UI notices on the Buy Coins flow and site footer stating that no refunds are provided and coins cannot be converted back to real money.

## 2. Market Research / Requirements

Not applicable — legal/UX compliance for a mock betting platform with real Pix purchases. Required copy:

| Topic | Portuguese (primary) | English (secondary) |
|-------|---------------------|---------------------|
| No refunds | **Não haverá reembolso.** Todas as compras de moedas são finais. | **No refunds will be provided.** All coin purchases are final. |
| Non-convertible | **As moedas não podem ser convertidas de volta em dinheiro real; são exclusivamente para uso no campeonato.** | **Coins cannot be converted back into real money; they are exclusively for championship use.** |

Place notices where users make purchase decisions: [`CoinsPage.tsx`](../../apps/web/src/pages/CoinsPage.tsx) and a persistent site footer.

## 3. Tech Stack & Dependencies

| Item | Purpose |
|------|---------|
| React presentational components | `FinancialDisclaimer`, `SiteFooter` |
| Shared copy constants | `apps/web/src/constants/disclaimers.ts` |
| Existing layout / Coins page | Integration points |
| Vitest + RTL | Assert copy renders correctly |

No new npm packages required.

## 4. MCPs to Utilize

| MCP | Cursor mapping | When to use |
|-----|----------------|-------------|
| `@modelcontextprotocol/server-filesystem` | Built-in Read/Write | Components, constants, tests, page integration |
| `@modelcontextprotocol/server-git` | Shell `git` | Branch `feature/financial-disclaimers` |
| `@modelcontextprotocol/server-browser` | `cursor-ide-browser` | Visual verify prominence on Coins page and footer |

## 5. Engineering Rules

### TDD

- Write failing RTL test: `FinancialDisclaimer` renders exact PT strings.
- Write failing test: EN strings present (visible or in `lang="en"` subsection).
- If Pix CTA gated: test button disabled until checkbox checked.

### Clean Code

- Single source of truth for copy in `disclaimers.ts` — no duplicated strings across components.
- Presentational components only; no business logic.

### Design Patterns

- **Presentational components**: `FinancialDisclaimer`, `SiteFooterDisclaimer`.
- **Composition**: embed banner in CoinsPage; footer in shared layout shell.

### Best Practices

- Use semantic HTML: `<aside role="note">` or `<section aria-labelledby="disclaimer-heading">`.
- Sufficient color contrast in both themes (coordinate with Action Plan 02 if merged).
- Do not use dismissible toast — disclaimers must remain visible.
- Run `npm run lint`, `npm run check-types`, `npm run test:web`.

## 6. Step-by-Step Implementation Checklist

### Phase A — Copy & components (TDD)

- [ ] **MCP: git** — Branch `feature/financial-disclaimers`.
- [ ] **MCP: filesystem** — Create `apps/web/src/constants/disclaimers.ts` with PT/EN strings.
- [ ] **Write test first**: `apps/web/src/components/legal/__tests__/FinancialDisclaimer.test.tsx`.
- [ ] **MCP: filesystem** — Create `apps/web/src/components/legal/FinancialDisclaimer.tsx`:
  - Prominent banner (icon + heading "Aviso importante")
  - PT paragraphs (primary, larger text)
  - EN paragraphs (secondary, smaller/muted)
  - `variant`: `"banner"` | `"compact"` for footer
- [ ] **Write test first**: `SiteFooterDisclaimer.test.tsx` (compact variant).
- [ ] **MCP: filesystem** — Create `apps/web/src/components/legal/SiteFooterDisclaimer.tsx`.

### Phase B — Integration

- [ ] **MCP: filesystem** — Add `<FinancialDisclaimer />` above Pix purchase section in [`CoinsPage.tsx`](../../apps/web/src/pages/CoinsPage.tsx) (before "Comprar com Pix" CTAs).
- [ ] **MCP: filesystem** — Add optional acknowledge checkbox:

```tsx
const [acknowledged, setAcknowledged] = useState(false);
// Disable Pix buttons when !acknowledged
```

- [ ] **MCP: filesystem** — Add `<SiteFooterDisclaimer />` to shared layout:
  - Option A: new `AppFooter.tsx` included in pages with `Navigation`
  - Option B: add to [`Navigation.tsx`](../../apps/web/src/components/Navigation.tsx) wrapper or page shell component
- [ ] **MCP: browser** — Verify banner visible without scrolling on desktop Coins page.

### Phase C — Polish

- [ ] Ensure disclaimer visible on mobile (stacked layout, readable font size ≥14px).
- [ ] Run tests → green.
- [ ] Run `npm run lint`, `npm run check-types`, `npm run test:web`.

## 7. UI/UX Implementation Details

### Placement

1. **Coins page banner** — Full-width alert above package list and Pix buttons. Use border + subtle background (`--sb-surface` with accent border) — not a dismissible modal.
2. **Site footer** — Compact one-line summary on all public/authenticated pages with main nav.

### Acknowledge gate (recommended)

Before first Pix purchase in session, require checkbox:

> Li e entendo que não há reembolso e que as moedas não são conversíveis em dinheiro real.

Pix CTAs disabled until checked. Reset checkbox on page leave (session-only, not persisted).

### Visual hierarchy

- Heading: "Aviso importante" / "Important notice"
- PT body: normal weight
- EN body: `text-sm text-muted`
- No emojis; professional tone for financial-adjacent content

## 8. Code Snippets / Pseudo-code

### disclaimers.ts

```typescript
// apps/web/src/constants/disclaimers.ts
export const DISCLAIMERS = {
  pt: {
    heading: "Aviso importante",
    noRefunds:
      "Não haverá reembolso. Todas as compras de moedas são finais.",
    nonConvertible:
      "As moedas não podem ser convertidas de volta em dinheiro real; são exclusivamente para uso no campeonato.",
    acknowledge:
      "Li e entendo que não há reembolso e que as moedas não são conversíveis em dinheiro real.",
  },
  en: {
    heading: "Important notice",
    noRefunds: "No refunds will be provided. All coin purchases are final.",
    nonConvertible:
      "Coins cannot be converted back into real money; they are exclusively for championship use.",
  },
} as const;
```

### FinancialDisclaimer.tsx

```tsx
import { DISCLAIMERS } from "../../constants/disclaimers";

export function FinancialDisclaimer({ variant = "banner" }: { variant?: "banner" | "compact" }) {
  const { pt, en } = DISCLAIMERS;
  return (
    <aside
      role="note"
      aria-labelledby="disclaimer-heading"
      className={variant === "banner" ? "disclaimer-banner" : "disclaimer-compact"}
    >
      <h2 id="disclaimer-heading">{pt.heading}</h2>
      <p lang="pt">{pt.noRefunds}</p>
      <p lang="pt">{pt.nonConvertible}</p>
      <div lang="en" className="text-sm opacity-80">
        <p>{en.noRefunds}</p>
        <p>{en.nonConvertible}</p>
      </div>
    </aside>
  );
}
```

### CoinsPage integration

```tsx
<FinancialDisclaimer />
<label>
  <input
    type="checkbox"
    checked={acknowledged}
    onChange={(e) => setAcknowledged(e.target.checked)}
  />
  {DISCLAIMERS.pt.acknowledge}
</label>
<button disabled={!acknowledged || pixLoading} onClick={startPix}>
  Comprar com Pix
</button>
```

## 9. Testing & Success Criteria

### Automated

- [ ] RTL: PT strings `"Não haverá reembolso"` and `"não podem ser convertidas"` present.
- [ ] RTL: EN strings present in document.
- [ ] RTL: Pix button disabled when acknowledge unchecked (if gated).
- [ ] RTL: footer compact variant renders on layout.
- [ ] `npm run lint`, `npm run check-types` clean.

### Manual (MCP: browser)

- [ ] Coins page shows banner above purchase CTAs without scrolling (desktop).
- [ ] Footer disclaimer visible on Home and Coins.
- [ ] Checkbox gates Pix purchase when implemented.
- [ ] Readable in light and dark theme.

### Success criteria

Disclaimers complete when exact PT/EN copy is prominently displayed on Buy Coins flow and footer, tests pass, and purchase gate works if enabled.
