<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Design System

**Tailwind v4 — no `tailwind.config.ts`.** All tokens are defined in `app/globals.css` using the `@theme inline` directive. Tailwind reads CSS vars directly.

**Token file:** `app/globals.css` — the only SSOT for all design tokens.

### Colors — defined in `@theme inline`

**Primitive overrides (`:root`):**
```css
--background: #ffffff;  /* light mode */
--foreground: #171717;
/* dark mode (prefers-color-scheme): #0a0a0a / #ededed */
```

**Brand (teal):**
```css
--color-brand:         #0d9488;  /* teal-600 */
--color-brand-hover:   #0f766e;  /* teal-700 */
--color-brand-subtle:  #f0fdfa;  /* teal-50  */
--color-brand-muted:   #ccfbf1;  /* teal-100 */
--color-brand-dim:     #99f6e4;  /* teal-200 */
--color-brand-ring:    #14b8a6;  /* teal-500 — focus ring */
--color-brand-dark:    #0f766e;  /* teal-700 */
--color-brand-darker:  #134e4a;  /* teal-900 */
--color-brand-body:    #115e59;  /* teal-800 */
```

**Ink (text hierarchy):**
```css
--color-ink:        #0f172a;  /* slate-900 */
--color-ink-soft:   #334155;  /* slate-700 */
--color-ink-muted:  #64748b;  /* slate-500 */
--color-ink-faint:  #94a3b8;  /* slate-400 */
```

**Surface:**
```css
--color-surface:           #ffffff;
--color-surface-subtle:    #f8fafc;  /* slate-50  */
--color-surface-muted:     #f1f5f9;  /* slate-100 */
--color-surface-emphasis:  #e2e8f0;  /* slate-200 */
```

**Border:**
```css
--color-border:         #e2e8f0;  /* slate-200 */
--color-border-strong:  #cbd5e1;  /* slate-300 */
--color-border-subtle:  #f1f5f9;  /* slate-100 */
```

**Semantic states:** error (`#dc2626`), warning/amber (`#d97706`), caution/yellow (`#ca8a04`), info/blue (`#2563eb`), accent/violet (`#7c3aed`) — each has `-subtle`, `-dim`, `-dark`, `-hover`, and `-ring` variants. See `app/globals.css` for full list.

**Chart:** `--color-chart-1` `#14b8a6` (teal-500), `--color-chart-2` `#a78bfa` (violet-400), `--color-chart-3` `#60a5fa` (blue-400).

**Dark overlay surface:**
```css
--color-surface-overlay:  #0f172a;  /* slate-900 — chart tooltips, dark sidebar */
```

### Shape & Elevation

```css
--radius-element: 0.5rem;   /* inputs, buttons */
--radius-card:    0.75rem;  /* cards, modals */
--radius-pill:    9999px;   /* badges, pills */

--shadow-card:     0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-elevated: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-overlay:  0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
```

### Typography

```css
--font-sans: var(--font-geist-sans);
--font-mono: var(--font-geist-mono);
/* Base font-size: 18px (bumped from browser default 16px) */
```

### Tailwind v4 Class Usage

CSS vars from `@theme inline` become Tailwind utilities automatically:

```
bg-brand / text-ink / bg-surface-subtle / border-border
rounded-element / rounded-card / rounded-pill
shadow-card / shadow-elevated / shadow-overlay
```

### SSOT Rule

All design tokens live in `app/globals.css` only. Tailwind config MUST reference CSS vars (`'var(--name)'`), never literal values. Components MUST use semantic Tailwind classes, never arbitrary values like `bg-[#hex]`.

**Violations to fix when touching UI:**
- `bg-[#hex]` / `text-[#hex]` in className → CSS var + semantic class
- `style={{ color: '#hex' }}` → CSS var + className
- Literal hex in tailwind.config → `'var(--color-name)'`
- Same token defined in 2+ files → consolidate to globals.css

**Audit:** `grep -r '\[#' app/` — every result is a violation.
