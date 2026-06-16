@~/.claude/CLAUDE.md

# Surf Your Life — Project Standards

## Mission

Surf Your Life is a psychiatry-led clinic in Zürich helping people recover from burnout and Long COVID. The portal exists to give clients a structured way to track their recovery (daily check-ins, symptoms, sleep, techniques) and to give practitioners (Manu and team) the visibility they need to intervene early, run evidence-based programs, and analyze progress — replacing ad-hoc spreadsheets with a purpose-built clinical tool. Success means practitioners spend less time chasing status and more time on high-value clinical work; clients feel accompanied and can see their own progress.

**What this is:** A health portal for burnout/Long-COVID reintegration and longevity. Clients track their wellbeing; practitioners (Manu and team) manage and analyze client progress. AI analysis of structured + unstructured data is a core future feature.

**Stack:** Next.js 16 (App Router) · TypeScript strict · self-hosted PostgreSQL (pg driver, `output: "standalone"`) · Drizzle ORM · pgvector · Auth.js v5 · Tailwind v4 · self-hosted on Hetzner (bitbaum box, behind Caddy)

---

## Architecture

```
app/
  (auth)/          → Public: login, register, forgot-password
  (portal)/        → Clients: dashboard, check-in, profile
  (admin)/admin/   → Practitioners/admins: clients, documents, insights
  api/             → Thin HTTP layer — validate input, call domain, return response

lib/
  db/
    schema.ts      → SSOT for all data structures. Types derived from here.
    index.ts       → Drizzle client (one instance)
  domain/          → Business logic. No HTTP, no UI. Reusable.
  auth/            → Auth.js config, session helpers
  constants.ts     → Enum display values, magic numbers, config arrays
  utils.ts         → Shared pure utilities (cn, formatDate, formatEnumValue)

components/
  ui/              → Primitives: Button, Input, Card, PageHeader, StatCard, etc.
  portal/          → Client-facing composed components
  admin/           → Admin-facing composed components
  auth/            → Reusable auth UI (GoogleButton, etc.)

proxy.ts           → Route protection only. No business logic.
```

### Route Groups

- `(auth)` — unauthenticated only. Middleware redirects logged-in users away.
- `(portal)` — clients. URLs: `/dashboard`, `/check-in`, `/profile`
- `(admin)` — practitioners + admins. URLs: `/admin/*`

---

## Principles — How They Apply Here

### SSOT

Every piece of data lives in exactly one place.

**Database:**
- `lib/db/schema.ts` is the SSOT for all data shapes. TypeScript types are derived from it (`$inferSelect`, `$inferInsert`). Never define a type manually that mirrors a DB table.
- Enum values (roles, moods, document types) are defined once in `schema.ts` enums and reused everywhere — in Zod schemas, display config, and UI components.

**Config:**
- Mood options, concern categories, energy scale bounds — all live in `lib/constants.ts`. Components import from there. Never hardcode an array of options inside a component.
- Color palette, spacing scale, and typography defined once in `tailwind.config.ts`. Components use semantic tokens, not raw values.

**Logic:**
- Role-based redirect destination defined once in `lib/domain/auth.ts`. Used by both `proxy.ts` and `app/page.tsx`.
- Onboarding completion criteria defined once (not re-computed in multiple places).

### DRY

If you write it twice, extract it. The rule of three is the maximum — not the target.

**Components to always use (never re-implement inline):**
- `<PageHeader title description />` — page titles + subtitles
- `<StatCard label value icon color />` — dashboard metric tiles
- `<GoogleButton />` — Google OAuth button (one SVG, one place)
- `<RangeInput label min max value onChange />` — slider + value display
- `<EmptyState message action />` — empty list states

**Utilities to always use:**
- `formatEnumValue(str)` — converts `very_low` → `Very low` (not `.replace("_", " ")` inline)
- `cn(...)` — className merging
- `formatDate(date)` — date display

**Patterns:**
- API validation schemas live in `lib/domain/`, imported by both API routes and form validation. Never define the same shape twice.
- Sidebar navigation items live in a config array, not hardcoded inside the component.

### SoC (Separation of Concerns)

Each layer has one job.

| Layer | Job | Not its job |
|-------|-----|-------------|
| `lib/db/schema.ts` | Define data shapes | Business rules |
| `lib/domain/` | Business logic | HTTP concerns, UI state |
| `app/api/` | Validate input, call domain, return HTTP response | Business logic |
| Page components | Fetch data, compose UI | Business logic |
| UI components | Render | Data fetching, routing |
| `proxy.ts` | Redirect unauthenticated/unauthorized requests | Business logic |

**Page size limit:** If a page file exceeds 200 lines, extract components.
**Component size limit:** If a component exceeds 150 lines, split it.

When a form has 3+ sections, each section is a separate component.

### YAGNI

Don't build what isn't used yet.

- The vector columns (`embedding`) in the schema are intentional future infrastructure. They don't violate YAGNI because they're trivial to include now and painful to add later (migration + backfill). Everything else follows YAGNI strictly.
- **Do not ship UI for features that have no backend.** If the backend isn't done, the UI doesn't ship. A fake loading spinner or placeholder is never acceptable.
- The `assignments` table and `documents` table exist in schema — don't build UI for them until there's a clear use case.
- Remove sidebar links to pages that don't exist.

### KISS

Simplest solution that is correct.

- Forms with 4+ fields use a single `state` object, not individual `useState` per field.
- Validation: Zod at API boundary. HTML5 constraints (`required`, `minLength`) at form level. No custom validation logic.
- Auth: session from `auth()` server-side. No custom session parsing.
- Avoid custom hooks unless the logic is reused in 2+ places.

### Progressive Disclosure

Show what the user needs now. Reveal complexity as they're ready.

**For clients:**
1. First visit → onboarding banner (complete profile CTA)
2. Profile form → required fields first (concern + goals), optional fields collapsible
3. Dashboard → three key numbers + one action. Detail on demand.
4. Check-in → mood + energy required, reflection optional (collapsed by default)

**For admins:**
1. Dashboard → aggregate numbers. No client details until clicked.
2. Client list → name, email, concern, joined date. Full profile on detail page.
3. Client detail → profile summary + check-in history. AI insights when implemented.

**Auth:**
1. Primary path: Google OAuth (one click)
2. Secondary: email/password (below the fold)

### Maintainability

Code is read 10× more than written.

- **No magic numbers.** Every limit, scale bound, or threshold is a named constant in `lib/constants.ts`.
- **Consistent error format across all API routes:**
  ```ts
  // Success
  { success: true, data?: T }
  // Error
  { success: false, error: string }
  ```
- **All API routes follow the same pattern:**
  1. Authenticate session
  2. Validate input with Zod (schema from `lib/domain/`)
  3. Call domain logic
  4. Return response
- **No TODO comments in committed code.** Either implement it or open a GitHub issue.
- **Error boundaries** on every major route group layout.

### Scalability

Design for 10× the current load. Don't over-engineer for 1000×.

- **Pagination on all list queries.** Default page size: 20. Always pass `limit` and `offset` to Drizzle queries. Never load an unbounded list.
- **No N+1 queries.** Use Drizzle's `with:` for relations. Verify with query logging in dev.
- **pgvector for AI search.** When embedding generation is added, store in the existing `embedding` columns. Use cosine similarity for semantic search. No external vector DB needed at this scale.
- **Indexes.** Every foreign key that's queried has an index. Every column used in `WHERE` clauses that runs frequently gets an index.
- **Server components by default.** Only use `"use client"` when you need browser APIs or interactivity. Reduces bundle size.

### Design System

**Tailwind v4 — no `tailwind.config.ts`.** All tokens are defined in `app/globals.css` using the `@theme inline` directive. Tailwind reads CSS vars directly; no separate config file exists or is needed.

**Token file:** `app/globals.css` — this is the only SSOT for all design decisions.

#### Colors — `@theme inline` in `app/globals.css`

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

#### Shape & Elevation

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

#### Typography

```css
--font-sans: var(--font-geist-sans);
--font-mono: var(--font-geist-mono);
/* Base font-size bumped to 18px so text-sm ≈ 16px — do not touch per-component */
```

#### Tailwind class usage

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

All design tokens live in `app/globals.css` only. There is no `tailwind.config.ts` — Tailwind v4 reads the `@theme inline` block directly. Components MUST use semantic Tailwind classes, never arbitrary values like `bg-[#hex]`.

**Violations to fix when touching UI:**
- `bg-[#hex]` / `text-[#hex]` in className → CSS var + semantic class
- `style={{ color: '#hex' }}` → CSS var + className
- Literal hex in any config → `'var(--color-name)'`
- Same token defined in 2+ files → consolidate to globals.css

**Audit:** `grep -r '\[#' app/` — every result is a violation.

### Accessibility

- All interactive elements: min 44×44px touch target
- All images: `alt` text
- All form inputs: associated `<label>`
- Keyboard navigation: logical tab order, visible focus ring
- Color is never the only indicator of state (use icon + color)

---

## Database Rules

- **All migrations are SQL files in `drizzle/`.** Never use `db:push` in production — it's for development only.
- **pgvector is enabled.** `embedding vector(1536)` columns are on `profiles`, `check_ins`, and `documents`. When adding AI features, generate embeddings using `text-embedding-3-small` (1536 dims) via OpenAI.
- **RLS is not used.** Authorization is handled in the application layer — always check `session.user.id` before any query.
- **Never expose a user's data to another user.** Every query that fetches user-owned data must include a `where eq(table.userId, session.user.id)` clause.

---

## What's Not Built Yet (Do Not Add Prematurely)

- Notifications (in-app or push)

These will be built in order of user value. Do not add scaffolding for them ahead of time.

## What IS Built (Updated from "not yet" list)

- **AI chat + embeddings** — `app/(portal)/ai-chat/` (client-facing), `lib/domain/ai-chat.ts` (Claude API + rule-based fallback), `lib/domain/embeddings.ts` (OpenAI text-embedding-3-small). Embeddings generated on check-in create/update, document upload, and via cron backfill at `app/api/cron/embed-backfill/`.
- **Document upload by clients** — `app/(portal)/documents/` with `document-upload-form.tsx`; admin side at `app/(admin)/admin/clients/[id]/`. API routes at `app/api/portal/documents/` and `app/api/admin/clients/[id]/documents/`.
- **Practitioner assignment UI** — `practitioner-assignment-card.tsx` on client detail page.
- **At-risk clients page** — `app/(admin)/admin/clients/at-risk/` with SQL HAVING clause for efficient filtering.

---

## CI/CD

- **GitHub Actions** runs on every PR: `tsc --noEmit` + `eslint --max-warnings 0`
- **Self-hosted deploy:** `main` is deployed to the Hetzner box (bitbaum, behind Caddy). The app is built with `output: "standalone"` and runs as a Node process behind the Caddy reverse proxy.
- **Branch protection:** PRs must pass CI before merge.
- **Never commit `.env.local` or `.env.selfhost.local`.** All secrets live in the box environment + `.env.example` for documentation.

## Scheduled jobs (cron)

The `/api/cron/*` routes (reminders, weekly-report, ai-digest, embed-backfill) are triggered by the box scheduler (systemd timers / cron on the Hetzner box) hitting the routes on schedule. The schedules are documented in `vercel.json` (kept as the canonical schedule reference even though Vercel cron is no longer the executor — see the `crons` array there for paths and cron expressions).

## Deploy Workflow

After `git push`, deploy to the Hetzner box and confirm the build succeeds and the process is healthy. Production URL: `https://surf-your-life.orangecat.ch`.
