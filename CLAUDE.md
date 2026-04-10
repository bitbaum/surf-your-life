@~/.claude/CLAUDE.md

# Surf Your Life — Project Standards

**What this is:** A health portal for burnout/Long-COVID reintegration and longevity. Clients track their wellbeing; practitioners (Manu and team) manage and analyze client progress. AI analysis of structured + unstructured data is a core future feature.

**Stack:** Next.js 16 (App Router) · TypeScript strict · Neon Postgres · Drizzle ORM · pgvector · Auth.js v5 · Tailwind v4 · Vercel

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

Every pixel follows these rules. If it's not in the system, add it to the system first.

**Colors (semantic):**
- Primary: `teal-600` (actions, active states, links)
- Primary hover: `teal-700`
- Primary subtle: `teal-50` (backgrounds, badges)
- Neutral text: `slate-900` (headings), `slate-700` (body), `slate-500` (secondary), `slate-400` (placeholder/metadata)
- Neutral surface: `white` (cards), `slate-50` (page background), `slate-100` (hover)
- Neutral border: `slate-200`
- Destructive: `red-600`
- Success: `teal-600` (same as primary — no green separate)
- Admin accent: same palette, dark sidebar (`slate-900`)

**Spacing scale (use only these):**
- `gap-1.5` — tight (label + input)
- `gap-2` — compact (icon + text)
- `gap-3` — default inline
- `gap-4` — default block
- `gap-6` — section spacing
- `gap-8` — page section spacing
- `p-6` — card padding
- `p-8` — page padding

**Typography:**
- Page title: `text-2xl font-bold text-slate-900`
- Page subtitle: `text-slate-500 mt-1`
- Card title: `text-lg font-semibold text-slate-900`
- Label: `text-sm font-medium text-slate-700`
- Body: `text-sm text-slate-600`
- Meta/caption: `text-xs text-slate-400`

**Border radius:**
- Inputs, buttons: `rounded-lg`
- Cards: `rounded-xl`
- Badges, pills: `rounded-full`
- Icon containers: `rounded-lg`

**Shadows:**
- Cards: `shadow-sm`
- Dropdowns/popovers: `shadow-md`
- Modals: `shadow-lg`

**Interaction states (all interactive elements must have):**
- Hover: color shift or background
- Focus: `focus-visible:ring-2 focus-visible:ring-teal-500`
- Disabled: `opacity-50 pointer-events-none`
- Loading: spinner + disabled state, never just disabled

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
- **RLS is not used** (Neon doesn't enforce it by default). Authorization is handled in application layer — always check `session.user.id` before any query.
- **Never expose a user's data to another user.** Every query that fetches user-owned data must include a `where eq(table.userId, session.user.id)` clause.

---

## What's Not Built Yet (Do Not Add Prematurely)

- Password reset email (needs Resend integration)
- Email verification
- AI analysis / embeddings generation
- Document upload/management UI
- Practitioner assignment UI
- Notifications
- Mobile navigation (hamburger menu)

These will be built in order of user value. Do not add scaffolding for them ahead of time.

---

## CI/CD

- **GitHub Actions** runs on every PR: `tsc --noEmit` + `eslint --max-warnings 0`
- **Vercel** auto-deploys `main` to production. Every PR gets a preview URL.
- **Branch protection:** PRs must pass CI before merge.
- **Never commit `.env.local`.** All secrets go in Vercel env vars + `.env.example` for documentation.
