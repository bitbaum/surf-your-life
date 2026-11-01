<!-- fleet:rules:begin — generated from bitbaum/fleet templates/agent-rules.md; edit it there, not here -->

## Org rules

Read `bitbaum/fleet` `AGENTS.md`, `SHARED.md` and the registers it names before
inventing a host, a name, a page or a shared behaviour. Do not copy their facts
into this file.

- **Packages first.** If a `@bitbaum/*` package (or `bip-kit`, `limitkit`,
  `threadkit`, `ai-forms`) already does it, use it and fix a defect in the
  package, not in this app. Every chat is `@bitbaum/chatkit`, every search box
  `@bitbaum/searchkit`, every chart `@bitbaum/chartkit`, accounts
  `@bitbaum/accountkit`, model calls `@bitbaum/ai-kit`. Review this product's
  `package-plan.json` before building anything. When a second product needs
  what one product built (a map, a globe, a calculator), extract it into a
  package before writing the second copy.
- **A gap is a task, not an answer.** Never end the work, or a reply, at "not
  supported" or "not available". When a source cannot be read or a case does
  not fit the model, find another way (another format or publisher, the
  official tool measured, the model extended) and do it. What truly cannot be
  done yet is tracked with its plan, never presented as a limit of the product.
- **Every page leads to an action.** What a reader learns, they can act on
  from the same screen: file, pay, apply, compare, ask, contact.
- **One shape per kind.** Things of the same kind look the same and sit in the
  same place (fleet `AGENTS.md`, "One shape per kind").
- **Finished work ships by itself.** Open a non-draft pull request; the fleet
  auto-merge sweep is the only merge path. Never merge by hand, through the
  merge API, with `--auto` or with an admin bypass, and never force-push a
  shared branch.
- **Nothing made up.** A fact on a page or in a doc needs a source that was
  opened; where there is none, the line is removed or softened. A gap is
  filled with sourced data, never with a guess.
- **Bitcoin orange is for Bitcoin and top-of-funnel actions only.**
- **No model identifier** in anything pushed to a repository.
- Before you finish, run `node <fleet>/scripts/ci/docs-truth-audit.mjs --dir .`:
  the same check the sweep runs on every pull request.

<!-- fleet:rules:end -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know


This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## What this is

Surf Your Life is a psychiatry-led clinic in Zürich helping people recover from
burnout and Long COVID. The portal gives clients a structured way to track
their recovery (daily check-ins, symptoms, sleep, techniques) and gives
practitioners the visibility to intervene early, run evidence-based programmes
and analyse progress. Success means practitioners spend less time chasing
status, and clients feel accompanied and can see their own progress.

## Commands & Ops

**Stack:** Next.js 16 (App Router, `output: "standalone"`) · TypeScript strict · self-hosted PostgreSQL (`pg` driver) · Drizzle ORM · pgvector · Auth.js v5 · Tailwind v4 (`@theme inline`, no config file). Package manager: **pnpm** (`pnpm install --frozen-lockfile`).

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` |
| **Verify (SSOT check bundle)** | `pnpm verify` → `format:check` + `lint` + `typecheck` + `test` |
| Typecheck only | `pnpm typecheck` (`tsc --noEmit`) |
| Lint only | `pnpm lint` (`eslint . --max-warnings 0`) |
| Tests only | `pnpm test` (`vitest run`) |
| Production build | `pnpm build` (hermetic — compiles with no DB reachable) |

**`verify` is the single source of truth for "is this change good."** CI (`.github/workflows/ci.yml`) runs `pnpm verify` then `pnpm build` verbatim — green `verify` + build locally ⇒ green CI. Run it before declaring any change done.

**Drizzle migrations:** SQL files live in `drizzle/`. Generate with `pnpm db:generate`, apply with `pnpm db:migrate`. `pnpm db:push` is dev-only — never in production.

**Deploy:** `main` deploys to the Hetzner box (bitbaum, behind Caddy) as a standalone Node process, through `.github/workflows/deploy.yml` (loki's reusable selfhost-deploy workflow). The database is the box's PostgreSQL, database `surf_your_life`; Neon was decommissioned 2026-06-12, so a laptop `.env.local` naming `neon.tech` is leftover, not production. Production URL: `https://surf-your-life.orangecat.ch`. Never commit `.env.local` / `.env.selfhost.local`.

## Architecture

```
app/
  [locale]/        → next-intl segment — every page lives under it
    (auth)/        → login, register, forgot-password (signed-out only)
    (portal)/      → clients: dashboard, check-in, profile, documents, AI chat, …
    (admin)/admin/ → practitioners and admins: clients, documents, insights
  api/             → thin HTTP layer, NOT localized: validate, call domain, respond
lib/
  db/schema.ts     → SSOT for every data shape; types via $inferSelect / $inferInsert
  db/index.ts      → the one Drizzle client
  domain/          → business logic and the Zod schemas API routes and forms share
  auth/            → Auth.js config, session helpers; `shared/` is AccountKit, which answers sign-in since 2026-11-01 (`AUTH_RUNTIME=accountkit`; `docs/ACCOUNTKIT-MIGRATION.md`)
  constants.ts     → option lists, scale bounds, limits — no magic numbers elsewhere
  utils.ts         → cn, formatDate, formatEnumValue
components/
  ui/              → primitives (PageHeader, StatCard, EmptyState, Button, …)
  portal/ admin/ auth/ → composed components per audience
proxy.ts           → route protection only
```

- Enum values (roles, moods, document types) are `schema.ts` enums, reused by
  Zod schemas, display config and components. Option arrays come from
  `lib/constants.ts`, never inline in a component.
- Roles and the staff test (`STAFF_ROLES`, `isStaff`, `resolveRole`) are
  defined once in `lib/domain/auth.ts`.
- Use the primitives rather than re-implementing them: `PageHeader`,
  `StatCard`, `EmptyState`, `GoogleButton`; and `formatEnumValue` (`very_low` →
  `Very low`), `cn`, `formatDate`.
- API routes authenticate, validate with a Zod schema from `lib/domain/`, call
  domain logic and answer `{ success: true, data? }` or
  `{ success: false, error }`.
- A page over 200 lines or a component over 150 lines gets split; a form with
  three or more sections is one component per section.
- Server components by default; `"use client"` only for browser APIs or
  interactivity. Every list query is paginated (default 20, `limit` +
  `offset`), relations load with Drizzle's `with:`, and frequently filtered
  columns and queried foreign keys are indexed.
- **Do not ship UI for a feature with no backend**, and no sidebar link to a
  page that does not exist. No `TODO` comments in committed code.
- Progressive disclosure: clients see the required fields first and optional
  ones collapsed (a check-in is mood + energy, reflection optional); admins see
  aggregates first and client detail on click.
- Accessibility: 44×44px targets, `alt` text, a `<label>` per input, a visible
  focus ring, and never colour alone to signal state.

## Auth

"Sign in with OrangeCat" (OIDC) is the primary path. Users are keyed on
`users.orangecat_sub`, never matched by email (`lib/auth/orangecat-store.ts`).
Email/password sits behind a disclosure for existing accounts, with the app's
own Google button only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are
both set (`lib/auth/google.ts`); production sets neither, so it is hidden there.

## Data rules

- Migrations are SQL files in `drizzle/`; `db:push` is development only.
- **RLS is not used.** Authorization is in the application: every query for
  user-owned data filters on `session.user.id`
  (`__tests__/user-isolation.test.ts`). Never expose one user's data to another.
- pgvector `embedding vector(1536)` columns sit on `profiles`, `check_ins` and
  `documents`. Embeddings are OpenAI's (the model is set in
  `lib/domain/embeddings.ts`), generated on check-in create/update, document
  upload and the `embed-backfill` cron.
- Client AI chat is `lib/domain/ai-chat.ts` on ai-kit's chain with a
  rule-based fallback.
- **No client data reaches a model or the embedding API without that client's
  consent.** `hasAiConsent` (`lib/domain/ai-consent.ts`, table
  `ai_consent_events`, append-only) is checked server-side on every AI path —
  assistant, check-in form help, session prep, weekly digest, embeddings and the
  backfill — and the client's consent governs even when staff start it. Without
  it a path takes its non-AI fallback or says AI is off.
  `__tests__/ai-consent-gates.test.ts`.

## Scheduled jobs

`/api/cron/*` routes are hit by systemd timers / cron on the box.

| Path | Cron | When |
| --- | --- | --- |
| `/api/cron/reminders` | `0 18 * * *` | daily 18:00 |
| `/api/cron/weekly-report` | `0 17 * * 0` | Sundays 17:00 |
| `/api/cron/embed-backfill` | `0 3 * * *` | daily 03:00 |

**No scheduled job may call a model on the free tier.** The free AI keys are
one pool shared by the box's apps, and an unattended job drains it. The weekly
AI digest is therefore the on-demand "Generate this week's digest" action on
the admin client page (`POST /api/admin/clients/[id]/digest`, staff only,
rate-limited), not a cron. `__tests__/cron-no-llm.test.ts` fails if any
`app/api/cron/**` route reaches `lib/domain/llm` or ai-kit's
`complete`/`freeChain`. `embed-backfill` is allowed only because it needs a
paid `OPENAI_API_KEY`; never point it at a free-tier provider.


## Design System

**Tailwind v4 — there is no `tailwind.config.ts`.** All tokens are defined in `app/globals.css` using the `@theme inline` directive. Tailwind reads CSS vars directly; no separate config file exists or is needed.

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
--color-brand:         #0f766e;  /* teal-700 — buttons, links, active states (teal-600 failed AA contrast) */
--color-brand-hover:   #115e59;  /* teal-800 */
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
--color-ink-faint:  #64748b;  /* slate-500 — placeholders, metadata (slate-400 was unreadable) */
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
