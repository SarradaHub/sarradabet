# Action Plan 02 — Dark/Light Mode Toggle

## 1. Goal

Add a functional dark/light theme toggle to the SarradaBet Vite React SPA, persisting user preference in `localStorage` and applying theme classes before first paint to prevent flash of wrong theme.

## 2. Market Research / Requirements

Not applicable — UX enhancement. Current state: app is **dark-only** with hardcoded `--sb-*` CSS variables in [`apps/web/src/index.css`](../../apps/web/src/index.css). Tailwind already has `darkMode: 'class'` in [`tailwind.config.cjs`](../../apps/web/tailwind.config.cjs).

**Note:** The original prompt suggested `next-themes` with SSR hydration handling. SarradaBet is a client-rendered SPA (Vite), not Next.js. Use a custom `ThemeProvider` + inline boot script in `index.html` (equivalent to `suppressHydrationWarning`).

## 3. Tech Stack & Dependencies

| Package / file | Purpose |
|----------------|---------|
| Custom `ThemeProvider` | React context for theme state |
| `localStorage` key `sarradabet-theme` | Persist `light` \| `dark` \| `system` |
| `apps/web/index.html` | Inline script to set `document.documentElement.classList` before React mounts |
| [`index.css`](../../apps/web/src/index.css) | Light + dark CSS variable sets |
| [`tailwind.config.cjs`](../../apps/web/tailwind.config.cjs) | Already `darkMode: 'class'` — no change needed |
| Vitest + RTL | Unit and component tests |

No new npm packages required unless team prefers `next-themes` (works in non-Next apps but adds dependency for minimal gain).

## 4. MCPs to Utilize

| MCP | Cursor mapping | When to use |
|-----|----------------|-------------|
| `@modelcontextprotocol/server-filesystem` | Built-in Read/Write | Edit CSS, context, components, tests |
| `@modelcontextprotocol/server-git` | Shell `git` | Branch `feature/theme-toggle` |
| `@modelcontextprotocol/server-browser` | `cursor-ide-browser` | Visual verify light/dark on Home, Coins, Admin |

## 5. Engineering Rules

### TDD

- Write failing tests for `resolveTheme(preference, systemPref)` pure function before `ThemeProvider`.
- Write failing RTL test: click toggle → `document.documentElement` has `dark` or `light` class.
- Write test: `localStorage` persists after toggle.

### Clean Code

- Separate concerns: `themeUtils.ts` (pure functions), `ThemeProvider.tsx` (state), `ThemeToggle.tsx` (presentational).
- Do not scatter `document.documentElement.classList` calls — centralize in one `applyTheme()` function.

### Design Patterns

- **Context + custom hook**: `ThemeProvider` + `useTheme()`.
- **Presentational component**: `ThemeToggle` receives `theme` and `onToggle` props (or uses hook internally for simplicity).

### Best Practices

- Respect `prefers-color-scheme` when preference is `system`.
- Toggle must be keyboard accessible (`button`, `aria-label`, `aria-pressed`).
- Mirror toggle in [`Navigation.tsx`](../../apps/web/src/components/Navigation.tsx) and [`AdminLayout.tsx`](../../apps/web/src/components/admin/AdminLayout.tsx).
- Run `npm run lint`, `npm run check-types`, `npm run test:web` before done.

## 6. Step-by-Step Implementation Checklist

### Phase A — CSS palette (TDD: visual baseline)

- [ ] **MCP: filesystem** — Read [`index.css`](../../apps/web/src/index.css) current `--sb-*` vars.
- [ ] **MCP: filesystem** — Move dark values under `.dark` selector; add light values under `:root` or `.light`:

```css
:root, .light {
  --sb-bg: #f4f4f5;
  --sb-surface: #ffffff;
  --sb-border: #e4e4e7;
  --sb-text: #18181b;
  --sb-text-muted: #71717a;
  --sb-accent: #16a34a; /* keep brand green */
}

.dark {
  --sb-bg: #0a0a0b;
  --sb-surface: #121214;
  --sb-border: #27272a;
  --sb-text: #f4f4f5;
  --sb-text-muted: #a1a1aa;
  --sb-accent: #22c55e;
}
```

- [ ] Audit hardcoded hex colors in components; replace with `var(--sb-*)` or Tailwind tokens where feasible (scope: touched files only).

### Phase B — Theme infrastructure (TDD)

- [ ] **MCP: git** — Branch `feature/theme-toggle`.
- [ ] **Write test first**: `apps/web/src/context/__tests__/themeUtils.test.ts` — `resolveTheme`, `applyTheme`.
- [ ] **MCP: filesystem** — Create `apps/web/src/context/themeUtils.ts`.
- [ ] **Write test first**: `apps/web/src/context/__tests__/ThemeProvider.test.tsx`.
- [ ] **MCP: filesystem** — Create `apps/web/src/context/ThemeProvider.tsx` with `useTheme()` export.
- [ ] **MCP: filesystem** — Add inline boot script to `apps/web/index.html`:

```html
<script>
  (function () {
    var key = 'sarradabet-theme';
    var stored = localStorage.getItem(key);
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.add(theme);
  })();
</script>
```

- [ ] **MCP: filesystem** — Wrap app in `ThemeProvider` inside [`App.tsx`](../../apps/web/src/App.tsx) or `main.tsx`.

### Phase C — Toggle UI

- [ ] **Write test first**: `apps/web/src/components/__tests__/ThemeToggle.test.tsx`.
- [ ] **MCP: filesystem** — Create `ThemeToggle.tsx` (sun/moon icons or text "Claro"/"Escuro").
- [ ] **MCP: filesystem** — Add toggle to [`Navigation.tsx`](../../apps/web/src/components/Navigation.tsx).
- [ ] **MCP: filesystem** — Add toggle to [`AdminLayout.tsx`](../../apps/web/src/components/admin/AdminLayout.tsx).
- [ ] Run tests → green → refactor.

### Phase D — Verification

- [ ] **MCP: browser** — Toggle on Home, Coins, Admin dashboard; no FOUC on hard refresh.
- [ ] **MCP: browser** — Set `system` preference; verify follows OS.
- [ ] Run `npm run lint`, `npm run check-types`, `npm run test:web`.

## 7. UI/UX Implementation Details

### Persistence strategy

| Key | Value | Behavior |
|-----|-------|----------|
| `localStorage['sarradabet-theme']` | `"light"` \| `"dark"` \| `"system"` | Read on boot; write on toggle |

### Color palette mapping

| Token | Light | Dark (current) |
|-------|-------|----------------|
| `--sb-bg` | `#f4f4f5` | `#0a0a0b` |
| `--sb-surface` | `#ffffff` | `#121214` |
| `--sb-border` | `#e4e4e7` | `#27272a` |
| `--sb-text` | `#18181b` | `#f4f4f5` |
| `--sb-text-muted` | `#71717a` | `#a1a1aa` |
| `--sb-accent` | `#16a34a` | `#22c55e` |

### FOUC prevention

The inline script in `index.html` runs synchronously before React hydration. `ThemeProvider` reads the same `localStorage` key on mount and stays in sync. No `suppressHydrationWarning` needed (SPA, not SSR).

### Toggle placement

- Main nav: right side, near user menu / login links.
- Admin: top bar in `AdminLayout`, consistent position.

## 8. Code Snippets / Pseudo-code

### themeUtils.ts

```typescript
export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "sarradabet-theme";

export function resolveTheme(
  preference: ThemePreference,
  systemDark: boolean,
): ResolvedTheme {
  if (preference === "system") return systemDark ? "dark" : "light";
  return preference;
}

export function applyTheme(theme: ResolvedTheme): void {
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(theme);
}

export function loadPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}
```

### ThemeToggle.tsx

```tsx
export function ThemeToggle() {
  const { preference, setPreference, resolved } = useTheme();
  const cycle = () => {
    const next = preference === "dark" ? "light" : preference === "light" ? "system" : "dark";
    setPreference(next);
  };
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={resolved === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-pressed={resolved === "dark"}
    >
      {resolved === "dark" ? "☀" : "☾"}
    </button>
  );
}
```

## 9. Testing & Success Criteria

### Automated

- [ ] `themeUtils.test.ts` — all preference + system combinations resolve correctly.
- [ ] `ThemeProvider.test.tsx` — toggle updates class and localStorage.
- [ ] `ThemeToggle.test.tsx` — button accessible, click triggers change.
- [ ] `npm run lint` and `npm run check-types` clean.

### Manual (MCP: browser)

- [ ] Hard refresh on light theme — no dark flash.
- [ ] Hard refresh on dark theme — no light flash.
- [ ] Toggle persists across page navigation and browser tab close/reopen.
- [ ] Admin pages respect theme.
- [ ] Text contrast readable in both modes (WCAG AA spot check).

### Success criteria

Theme toggle is complete when user can switch light/dark/system, preference persists, no FOUC on load, and tests are green.
