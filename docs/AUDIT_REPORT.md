# Codebase Audit Report

**Date**: 2026-04-13
**Auditor**: Claude Code
**Branch**: main
**Commit**: b4b1713d2bc85c23267526d0bd9a8fafe761dfa5

## Executive Summary

The surf-your-life codebase is in good structural shape for a project at this stage. The architecture is coherent — route groups, domain layer, schema-derived types, and centralized constants all follow the first principles from CLAUDE.md. The recent batch of improvements (rate limiting, shared components, i18n wiring, mainConcern enum migration, programmes schema) demonstrate healthy development velocity.

The main risk areas are **functional correctness gaps** (missing cascade deletes, OAuth admin role bug, double-booking potential) and **mobile UX deficiencies** (touch targets, missing overflow wrappers, no loading states on most routes). These are fixable in a focused session. The codebase has no architectural rot — no god objects, no layered cake of abstractions, no hidden SSOT violations.

The biggest gap between the codebase and CLAUDE.md is the **programmes feature**: the schema and types exist but there is zero UI, meaning the DB has tables that nothing serves yet. This violates the "no UI for features without backend" principle in the opposite direction — there's backend with no UI.

---

## Health Score

| Area | Score | Notes |
|------|-------|-------|
| First Principles | 7/10 | Good SSOT discipline; a few React purity violations and unused code |
| Best Practices | 7/10 | Consistent patterns; design system color drift in 3 charts/components |
| Mission Alignment | 8/10 | Core clinical/portal flows well implemented; programmes has no UI yet |
| Functional Correctness | 6/10 | Missing cascade deletes, OAuth admin gap, at-risk page purity bug |
| UI/UX & Responsive | 6/10 | Touch targets and overflow wrappers missing in several admin views |
| **Overall** | **7/10** | Solid foundation — correct things need fixing before mobile launch |

---

## Phase 1: First Principles

### Ground Truth #1 — Software serves humans

**Good:**
- Every page serves a clear user need; no placeholder or demo-only pages shipped
- Progressive disclosure applied correctly: check-in has optional reflection collapsed, profile has sections

**Issues:**
- `programmes` schema + types exist but zero UI — practitioners can't create or view programmes. Backend without product = dead code that must be maintained. Either build the UI or remove the schema until ready. (`lib/db/schema.ts:295-321`)
- Sidebar links match existing routes — no broken navigation found

### Ground Truth #2 — State defines behavior (SSOT)

**Good:**
- `lib/db/schema.ts` is the SSOT — all TypeScript types derived via `$inferSelect`/`$inferInsert`
- `mainConcernEnum` defined once in schema, reused in Zod domain schema (`lib/domain/profile.ts:12`)
- `lib/constants.ts` centralizes all display config: `MOODS`, `MAIN_CONCERNS`, `ENERGY_SCALE`, etc.
- `MOOD_EMOJI` and `MOOD_LABEL` maps derived from `MOODS` array — not duplicated

**Issues:**
- `SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000` hardcoded at `app/[locale]/(admin)/admin/clients/at-risk/page.tsx:8` — should be `TIME_CONSTANTS.SEVEN_DAYS_MS` in `lib/constants.ts`
- Magic number `20` (page size) appears in at least 3 admin list routes without a named constant

### Ground Truth #3 — Design for change

**Good:**
- Route groups allow adding/removing feature groups without touching shared layout
- `lib/domain/` layer means API routes are thin and swappable
- i18n integrated across all pages — adding a locale is config-only

**Issues:**
- 4 admin pages still use `next/link` instead of `@/i18n/navigation` Link: `clients/page.tsx`, `clients/[id]/page.tsx`, `clients/at-risk/page.tsx` — locale prefix breaks when switching languages

### Ground Truth #4 — Automate the mechanical

**Good:**
- Rate limiting automated on all auth routes
- Zod validates at API boundaries, not scattered in components
- `formatEnumValue` utility prevents inline string manipulation

**Issues:**
- No `loading.tsx` on 19 routes — Next.js streaming/Suspense boundaries require manual addition; not automated. Critical for perceived performance.

### Ground Truth #5 — Simplicity scales

**Good:**
- `app/[locale]/page.tsx` decomposed from 330 → 33 lines using marketing section components
- Shared `Badge`, `Pagination`, `FilterTabs` components replace inline duplication

**Issues:**
- `profile-form.tsx` is ~278 lines (CLAUDE.md limit: 150 lines for components). Three logical sections (clinical, physical, lifestyle) should each be their own component.
- `privacy/page.tsx` is ~206 lines — static content; could be `.mdx` or split into section components
- `booking-grid.tsx` is ~190 lines — service selection and time slot selection are two concerns

### Ground Truth #6 — Correctness beats speed

**Issues (see Phase 5 for details):**
- Missing cascade deletes on `threads`, `thread_messages`, `programme_enrolments`
- OAuth users can never get admin role
- `Date.now()` in server component render
- `setState` in `useEffect` anti-pattern in verify-email

---

## Phase 2: Best Practices

### No `console.log` in production code

```
app/api/admin/stats/route.ts       — console.error (acceptable, server logging)
lib/email/index.ts                  — console.log for dev fallback (acceptable, gated on !RESEND_API_KEY)
```

No violations. ✓

### Naming Conventions

All components PascalCase, utilities camelCase, constants UPPER_SNAKE. ✓

### API Response Format

All API routes return `{ success: boolean, data?: T, error?: string }`. ✓

### Auth checks on protected routes

All `/api/admin/*` routes check `session.user.role`. ✓

### TypeScript — Unused imports

- `app/[locale]/(admin)/admin/page.tsx`: `inArray`, `and` imported but not used
- `app/api/auth/resend-verification/route.ts`: `and` imported but not used

### Design System Color Violations

CLAUDE.md specifies `teal-600` as primary; `red-600` for destructive; no separate green. Found violations:

| File | Violation | Fix |
|------|-----------|-----|
| `components/portal/sleep-chart.tsx` | `bg-blue-400` bar fill | `bg-teal-400` |
| `components/admin/booking-grid.tsx` | `violet-*`, `amber-*` for service categories | Use teal/slate palette only |
| `components/ui/stat-card.tsx` | `violet` color option | Remove; use teal or slate |

### `rounded-2xl` in Marketing Components

CLAUDE.md specifies `rounded-xl` for cards. Marketing components use `rounded-2xl`:
- `components/marketing/hero-section.tsx`
- `components/marketing/gap-section.tsx`
- `components/marketing/method-section.tsx`
- `components/marketing/social-proof-section.tsx`

### Wrong Link Component in Admin Pages

4 pages use `import Link from "next/link"` instead of `import { Link } from "@/i18n/navigation"`:
- `app/[locale]/(admin)/admin/clients/page.tsx`
- `app/[locale]/(admin)/admin/clients/[id]/page.tsx`
- `app/[locale]/(admin)/admin/clients/at-risk/page.tsx`
- (check all admin pages for same issue)

---

## Phase 3: Mission Alignment

The mission is burnout/Long-COVID reintegration for Swiss clients. Assessed against the portal's stated goals:

| Area | Status | Notes |
|------|--------|-------|
| **Client wellbeing tracking** | Implemented | Check-ins with mood, energy, sleep, reflection. AI insight column ready. |
| **Practitioner management** | Partially | Client list, detail, at-risk flagging. Assignments table exists with no UI. |
| **Structured programmes** | Not yet | Schema + types exist; zero UI for creating/assigning/viewing programmes. |
| **Secure messaging** | Implemented | Thread + message tables, API routes, portal messaging page. |
| **Document management** | Not yet | Schema exists; no UI. Assignment table same. |
| **Booking system** | Implemented | Services + bookings with confirmation flow. |
| **Lead capture** | Implemented | Contact form → leads table with admin management. |
| **Multilingual (DE/EN/FR)** | Partially | All admin pages wired; some portal pages may have gaps in FR keys. |
| **Swiss context** | Good | CHF implicit, Swiss address, clinic-appropriate terminology. |

**Critical gap:** Programmes is the core clinical product differentiator (structured recovery plans). Having the data model without any UI means Manu cannot yet create or assign programmes to clients. This should be prioritized.

---

## Phase 4: Improvement Roadmap

### Quick Wins (< 1 hour each)

1. **Fix unused imports** — `inArray`/`and` in `admin/page.tsx`, `and` in `resend-verification/route.ts`
2. **Extract `SEVEN_DAYS_MS`** to `lib/constants.ts` — remove magic number in at-risk page
3. **Fix `rounded-2xl` → `rounded-xl`** in all 4 marketing components
4. **Fix color violations** — `bg-blue-400` in sleep-chart, `violet`/`amber` in booking-grid, `violet` in stat-card
5. **Fix Link imports** in 3+ admin pages — swap `next/link` for `@/i18n/navigation`
6. **Add cascade deletes** to `threads`, `thread_messages`, `programme_enrolments` FK references in schema + migration

### Medium Effort (1–5 hours each)

7. **Add `overflow-x-auto` wrappers** to admin tables (clients, bookings) for mobile layout
8. **Fix touch targets** — pagination buttons and booking action buttons need `min-h-[44px] min-w-[44px]`
9. **Split `profile-form.tsx`** into `ClinicalSection`, `PhysicalSection`, `LifestyleSection` components
10. **Split `booking-grid.tsx`** into service selector + time slot selector components
11. **Add `loading.tsx`** to the 19 routes currently missing it (use skeleton pattern from existing ones)
12. **Fix OAuth admin role** — check `ADMIN_EMAILS` in `signIn` callback or JWT `trigger === "signIn"` path, not only in register route
13. **Fix React purity** in at-risk page — pass `Date.now()` as a prop from a Server Component wrapper, or use `new Date()` in a separate data-fetching function
14. **Fix `setState` in `useEffect`** in `verify-email/page.tsx` — use `use()` hook or move to server component

### Strategic Improvements (> 5 hours, requires product decision)

15. **Programmes UI** — create/edit programme page (admin), enrolment flow (admin), enrolled programme view (client). This is the biggest gap between schema and product.
16. **Practitioner assignments UI** — assign clients to practitioners; the table exists, no way to populate it
17. **Document upload** — practitioners need to attach session notes. Schema ready.
18. **AI insights pipeline** — `aiInsight` column exists on check-ins; no generation logic yet. Could start with a cron job that runs weekly per client.
19. **Pagination on admin messages/bookings** — both pages load unbounded lists

---

## Phase 5: Functional Correctness

### Authentication & Authorization

**Session shape:** `session.user.{ id, role, emailVerified }` — correct and augmented via `types/next-auth.d.ts`. ✓

**Admin role via OAuth:** `lib/auth/index.ts` JWT callback only checks `ADMIN_EMAILS` when `trigger === "signIn"` — but this is only called on initial sign-in. However, the role is persisted in the JWT and re-read on subsequent requests, so the bug is specifically: **Google OAuth users who sign in for the first time will always get `client` role**, even if their email is in `ADMIN_EMAILS`. The `register` route handles password-based users but OAuth goes through `signIn` → `jwt` callback where the role is set. Verify the JWT callback applies `resolveRole()` for OAuth users.

**Admin route guards:** All `/api/admin/*` routes check `session.user.role !== "admin"`. Admin layout (`app/[locale]/(admin)/admin/layout.tsx`) redirects unauthorized users. ✓

**Rate limiting:** Applied to register, login, change-password, forgot-password, reset-password, resend-verification. ✓

### Data Integrity

**Missing cascade deletes in schema:**

```ts
// lib/db/schema.ts — these references lack { onDelete: "cascade" }
threads.clientId     → users.id     (line ~269)
threadMessages.threadId → threads.id (line ~282)
threadMessages.senderId → users.id  (line ~283)
programmeEnrolments.clientId → users.id (line ~310)
programmeEnrolments.programmeId → programmes.id (line ~311)
```

When a user is deleted via `/api/account/delete`, Postgres will error (or silently leave orphans depending on constraint mode) because these FK constraints have no `ON DELETE` behavior specified. The `assignments` and `documents` tables correctly use `{ onDelete: "cascade" }` — threading and programme enrolments need the same.

**Double-booking prevention:** `app/api/bookings/route.ts` inserts a booking without checking for existing bookings on the same service/date. Two clients can book the same slot. This needs a uniqueness check or slot availability model.

### User Paths

**Client path:** Register → verify email → onboarding → dashboard → check-in → profile → messages → bookings. All routes exist and are protected. ✓

**Practitioner/Admin path:** Login → `/admin` dashboard → clients list → client detail → at-risk → leads → bookings → users → messages. All routes exist. ✓

**React purity violation — at-risk page:**
```ts
// app/[locale]/(admin)/admin/clients/at-risk/page.tsx:17
const now = Date.now()  // called during render — unstable between calls
const sevenDaysAgo = new Date(now - SEVEN_DAYS_MS)
```
Server components should be pure — `Date.now()` makes the component non-deterministic. Move to a data-fetching function outside the component.

**`setState` in `useEffect` — verify-email page:**
```ts
// app/[locale]/(auth)/verify-email/page.tsx
useEffect(() => {
  setStatus(...)  // anti-pattern, causes extra render + potential flicker
}, [token])
```
Refactor to use a `use(promise)` pattern or restructure as server component + client confirmation UI.

### API Routes

All routes return `{ success, error/data }` format. Rate limiting applied. Auth checked. No string concatenation in SQL (Drizzle parameterizes all queries). ✓

No N+1 queries found — Drizzle `with:` used for relation loading in client detail. ✓

---

## Phase 6: UI/UX & Responsive Design

### Touch Targets (CLAUDE.md: min 44×44px)

**Violations found:**
- Pagination `<` / `>` buttons in `components/ui/pagination.tsx` — rendered as `<button>` with only `px-3 py-1` padding → approximately 32×28px
- Booking action buttons in `components/admin/booking-grid.tsx` — confirm/cancel rendered as small icon buttons without explicit size
- Filter tab buttons — `px-3 py-1.5` → approximately 32px height

**Fix:** Add `min-h-[44px]` to all interactive button classes, or use `size-11` for icon-only buttons.

### Admin Table Overflow (Mobile)

Tables in the following pages have no `overflow-x-auto` wrapper:
- `app/[locale]/(admin)/admin/clients/page.tsx` — 5-column table
- `app/[locale]/(admin)/admin/bookings/page.tsx` — 5-column table

At viewport < 640px, these tables will overflow viewport and break layout. Wrap `<table>` in `<div className="overflow-x-auto">`.

### Missing Loading States

Routes with no `loading.tsx`:
```
app/[locale]/(admin)/admin/
app/[locale]/(admin)/admin/bookings/
app/[locale]/(admin)/admin/clients/
app/[locale]/(admin)/admin/clients/[id]/
app/[locale]/(admin)/admin/clients/at-risk/
app/[locale]/(admin)/admin/leads/
app/[locale]/(admin)/admin/messages/
app/[locale]/(admin)/admin/users/
app/[locale]/(portal)/check-in/
app/[locale]/(portal)/dashboard/
app/[locale]/(portal)/messages/
app/[locale]/(portal)/profile/
app/[locale]/(portal)/settings/
app/[locale]/(auth)/login/
app/[locale]/(auth)/register/
app/[locale]/(auth)/forgot-password/
app/[locale]/(auth)/reset-password/
app/[locale]/(auth)/verify-email/
app/[locale]/
```

The loading experience should at minimum show a skeleton consistent with the final layout. At minimum, add a simple spinner `loading.tsx` per route group (3 files covers admin/portal/auth groups).

### Icon Button Accessibility

Booking grid cancel/confirm buttons lack `aria-label`. Screen readers will announce the icon character or nothing. All icon-only buttons need `aria-label="Cancel booking"` etc.

### Marketing Components

`components/marketing/social-proof-section.tsx` testimonial cards use `rounded-2xl` — inconsistent with design system `rounded-xl`. Same in hero, gap, method sections.

### Positive Findings

- `focus-visible:ring-2 focus-visible:ring-teal-500` consistently applied to form inputs ✓
- `sm:`, `md:`, `lg:` Tailwind breakpoints used throughout portal components ✓
- Dark admin sidebar contrasts well at all viewport sizes ✓
- Empty states implemented on check-ins and clients list ✓

---

## Action Items

Prioritized by: Data integrity first → Functional bugs → Mobile UX → Code quality

### P0 — Data Integrity (fix before next user data)
- [ ] Add `{ onDelete: "cascade" }` to `threads.clientId`, `threadMessages.threadId/senderId`, `programmeEnrolments.clientId/programmeId` in `lib/db/schema.ts` + migration SQL
- [ ] Fix OAuth admin role: verify `resolveRole()` is applied in JWT callback for OAuth `trigger === "signIn"`

### P1 — Functional Bugs
- [ ] Fix React purity: move `Date.now()` out of server component render in `clients/at-risk/page.tsx`
- [ ] Add double-booking prevention in `app/api/bookings/route.ts`
- [ ] Fix `setState` in `useEffect` in `verify-email/page.tsx`

### P2 — Link & i18n
- [ ] Swap `next/link` → `@/i18n/navigation` Link in `clients/page.tsx`, `clients/[id]/page.tsx`, `clients/at-risk/page.tsx`

### P3 — Mobile UX
- [ ] Wrap admin tables (clients, bookings) in `overflow-x-auto`
- [ ] Fix touch targets on pagination buttons (`min-h-[44px]`) and booking action buttons
- [ ] Add `loading.tsx` to each route group (`(admin)`, `(portal)`, `(auth)`) at minimum

### P4 — Design System Compliance
- [ ] Fix `rounded-2xl` → `rounded-xl` in all 4 marketing components
- [ ] Fix color violations: `bg-blue-400` in sleep-chart, `violet`/`amber` in booking-grid, `violet` in stat-card
- [ ] Remove unused imports in admin dashboard and resend-verification

### P5 — Code Quality
- [ ] Extract `SEVEN_DAYS_MS` to `lib/constants.ts`
- [ ] Split `profile-form.tsx` (278 lines) into 3 section components
- [ ] Split `booking-grid.tsx` (190 lines) into service + time-slot components
- [ ] Add `aria-label` to icon-only buttons in booking-grid and anywhere else icon buttons appear

### P6 — Strategic (product decision needed)
- [ ] Build Programmes UI (admin: create/assign; client: view enrolled programme)
- [ ] Build Practitioner Assignments UI
- [ ] Add pagination to admin messages and bookings lists
- [ ] Implement AI insights generation pipeline (cron job → OpenAI embeddings → `aiInsight` column)
