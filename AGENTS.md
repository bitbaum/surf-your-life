<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Commands & Ops

**Stack:** Next.js 16 (App Router, `output: "standalone"`) · TypeScript strict · self-hosted PostgreSQL (`pg` driver) · Drizzle ORM · pgvector · Auth.js v5 · Tailwind v4 (`@theme inline`, no config file). Package manager: **pnpm** (`pnpm install --frozen-lockfile`).

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` |
| **Verify (SSOT check bundle)** | `pnpm verify` → `typecheck` + `lint` + `test` |
| Typecheck only | `pnpm typecheck` (`tsc --noEmit`) |
| Lint only | `pnpm lint` (`eslint . --max-warnings 0`) |
| Tests only | `pnpm test` (`vitest run`) |
| Production build | `pnpm build` (hermetic — compiles with no DB reachable) |

**`verify` is the single source of truth for "is this change good."** CI (`.github/workflows/ci.yml`) runs `pnpm verify` then `pnpm build` verbatim — green `verify` + build locally ⇒ green CI. Run it before declaring any change done.

**Drizzle migrations:** SQL files live in `drizzle/`. Generate with `pnpm db:generate`, apply with `pnpm db:migrate`. `pnpm db:push` is dev-only — never in production.

**Deploy:** `main` deploys to the Hetzner box (bitbaum, behind Caddy) as a standalone Node process. Production URL: `https://surf-your-life.orangecat.ch`. Never commit `.env.local` / `.env.selfhost.local`.
<!-- END:nextjs-agent-rules -->

## Design System

**Tailwind v4 — no `tailwind.config.ts`.** All tokens are defined in `app/globals.css` using the `@theme inline` directive. Tailwind reads CSS vars directly; no separate config file exists or is needed.

**Token file:** `app/globals.css` — this is the only SSOT for all design decisions.

### Colors — `@theme inline` in `app/globals.css`

**Primitive overrides (`:root`):**
```css
--background: #ffffff;   /* light mode page bg */
--foreground: #171717;   /* light mode page text */
/* dark mode via @media (prefers-color-scheme: dark): #0a0a0a / #ededed */
```

**Brand (teal — primary interactive color):**
```css
--color-brand:         #0d9488;  /* teal-600 — buttons, links, active states */
--color-brand-hover:   #0f766e;  /* teal-700 */
--color-brand-subtle:  #f0fdfa;  /* teal-50  — light surface tint */
--color-brand-muted:   #ccfbf1;  /* teal-100 — stronger tint */
--color-brand-dim:     #99f6e4;  /* teal-200 — borders on brand surfaces */
--color-brand-soft:    #5eead4;  /* teal-300 — hover borders, light decorative accents */
--color-brand-ring:    #14b8a6;  /* teal-500 — focus ring */
--color-brand-dark:    #0f766e;  /* teal-700 — text on brand-subtle bg */
--color-brand-darker:  #134e4a;  /* teal-900 — strong text on brand-subtle bg */
--color-brand-body:    #115e59;  /* teal-800 — body text on brand-subtle bg */
```

**Ink (text hierarchy — light mode):**
```css
--color-ink:        #0f172a;  /* slate-900 — headings, primary text */
--color-ink-soft:   #334155;  /* slate-700 — labels, form values */
--color-ink-muted:  #64748b;  /* slate-500 — secondary text, descriptions */
--color-ink-faint:  #94a3b8;  /* slate-400 — placeholders, metadata */
```

**Surface (background hierarchy):**
```css
--color-surface:           #ffffff;  /* white     — cards, inputs */
--color-surface-subtle:    #f8fafc;  /* slate-50  — page background */
--color-surface-muted:     #f1f5f9;  /* slate-100 — hover states, secondary bg */
--color-surface-emphasis:  #e2e8f0;  /* slate-200 — active/selected states */
```

**Border:**
```css
--color-border:         #e2e8f0;  /* slate-200 */
--color-border-strong:  #cbd5e1;  /* slate-300 */
--color-border-subtle:  #f1f5f9;  /* slate-100 */
```

**Semantic states:**
```css
/* Error / Destructive */
--color-error:        #dc2626;  /* red-600 */
--color-error-hover:  #b91c1c;  /* red-700 */
--color-error-subtle: #fef2f2;  /* red-50  */
--color-error-dim:    #fecaca;  /* red-200 — borders on error surfaces */
--color-error-ring:   #f87171;  /* red-400 — focus ring on error inputs */

/* Warning (amber) */
--color-warning:        #d97706;  /* amber-600 */
--color-warning-subtle: #fffbeb;  /* amber-50  */
--color-warning-dim:    #fde68a;  /* amber-200 */
--color-warning-dark:   #b45309;  /* amber-700 */

/* Caution (yellow) */
--color-caution:        #ca8a04;  /* yellow-600 */
--color-caution-subtle: #fefce8;  /* yellow-50  */
--color-caution-dim:    #fef08a;  /* yellow-200 */
--color-caution-dark:   #a16207;  /* yellow-700 */

/* Info (blue) */
--color-info:        #2563eb;  /* blue-600 */
--color-info-subtle: #eff6ff;  /* blue-50  */
--color-info-dim:    #bfdbfe;  /* blue-200 */

/* Accent (violet) */
--color-accent:        #7c3aed;  /* violet-600 */
--color-accent-subtle: #f5f3ff;  /* violet-50  */
--color-accent-dim:    #ddd6fe;  /* violet-200 */
--color-accent-dark:   #6d28d9;  /* violet-700 */

/* Vivid indicator dots */
--color-error-vivid:   #ef4444;  /* red-500   */
--color-warning-vivid: #f59e0b;  /* amber-500 */
--color-caution-vivid: #facc15;  /* yellow-400 */
```

**Chart colors:**
```css
--color-chart-1:     #14b8a6;  /* teal-500   — primary series */
--color-chart-2:     #a78bfa;  /* violet-400 — secondary series */
--color-chart-3:     #60a5fa;  /* blue-400   — tertiary series */
--color-chart-1-lit: #2dd4bf;  /* teal-400   — primary label on dark bg */
--color-chart-2-lit: #c4b5fd;  /* violet-300 — secondary label on dark bg */
```

**Dark overlay surface (chart tooltips, dark sidebar):**
```css
--color-surface-overlay:         #0f172a;  /* slate-900 */
--color-surface-overlay-subtle:  #1e293b;  /* slate-800 */
--color-surface-overlay-muted:   #334155;  /* slate-700 */
--color-surface-overlay-border:  #334155;  /* slate-700 */
--color-ink-on-overlay:          #ffffff;
--color-ink-on-overlay-soft:     #e2e8f0;  /* slate-200 */
--color-ink-on-overlay-muted:    #cbd5e1;  /* slate-300 */
--color-ink-on-overlay-dim:      #94a3b8;  /* slate-400 */
--color-brand-on-overlay:        #2dd4bf;  /* teal-400 */
```

### Shape & Elevation

```css
/* Border radius */
--radius-element: 0.5rem;   /* rounded-lg  — inputs, buttons, small chips */
--radius-card:    0.75rem;  /* rounded-xl  — cards, modals, larger containers */
--radius-pill:    9999px;   /* rounded-full — badges, pills, circular icons */

/* Shadows */
--shadow-card:     0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-elevated: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-overlay:  0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
```

### Typography

```css
--font-sans: var(--font-geist-sans);
--font-mono: var(--font-geist-mono);
/* Base font-size bumped from browser default 16px to 18px so text-sm ≈ 16px — do not touch per-component */
```

### Tailwind class usage

Because this is Tailwind v4 with `@theme inline`, CSS vars become Tailwind utilities automatically. Use semantic class names:

```
bg-brand            → var(--color-brand)
text-ink            → var(--color-ink)
text-ink-muted      → var(--color-ink-muted)
bg-surface-subtle   → var(--color-surface-subtle)
border-border       → var(--color-border)
rounded-element     → var(--radius-element)
rounded-card        → var(--radius-card)
shadow-card         → var(--shadow-card)
```

**Interaction states (all interactive elements must have):**
- Hover: color shift or background
- Focus: `focus-visible:ring-2 focus-visible:ring-brand-ring`
- Disabled: `opacity-50 pointer-events-none`
- Loading: spinner + disabled state, never just disabled

### SSOT Rule

All design tokens live in `app/globals.css` only. There is no `tailwind.config.ts` — Tailwind v4 reads the `@theme inline` block directly; do not create one. Components MUST use semantic Tailwind classes, never arbitrary values like `bg-[#hex]`.

**Violations to fix when touching UI:**
- `bg-[#hex]` / `text-[#hex]` in className → CSS var + semantic class
- `style={{ color: '#hex' }}` → CSS var + className
- Literal hex in any config → `'var(--color-name)'`
- Same token defined in 2+ files → consolidate to globals.css

**Audit:** `grep -r '\[#' app/` — every result is a violation.
