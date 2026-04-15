# Codebase Audit Report

**Date**: 2026-04-14  
**Auditor**: Claude Code  
**Branch**: main  
**Commit**: 0103e62 — feat: i18n compliance pass + booking calendar (EN/DE/FR)

---

## Executive Summary

Surf Your Life is a health portal for burnout/Long-COVID reintegration built on Next.js 16, Drizzle ORM, Auth.js v5, and next-intl. The codebase reflects disciplined engineering: schema-driven types, config-driven constants, consistent API response format, complete role-based access control, and thorough i18n coverage (DE/EN/FR). The client check-in flow, practitioner dashboard, messaging system, booking calendar, and services manager are all implemented and functionally correct.

Three categories of issues require attention before the next release. **Critical** (must fix): one functional bug allows double-booking of the same service slot by two clients simultaneously. **High** (should fix before release): several hardcoded English strings in the check-ins history page and edit modal violate the i18n policy, and two SSOT violations duplicate mood label definitions. **Medium** (schedule soon): six files exceed the 200-line component size limit, small touch targets on pagination buttons (32px, below the 44px minimum), and missing aria-labels on modal close buttons.

Typecheck passes with zero errors. ESLint is clean. All cascade deletes are correctly wired. Authentication guards are present on every protected route. The AI/embedding infrastructure (pgvector, 1536-dim columns) is in place for future analysis. The codebase is in a healthy state with focused, addressable gaps.

---

## Health Score

| Area | Score | Notes |
|------|-------|-------|
| First Principles | 7/10 | SSOT violations in mood labels; 6 oversized files |
| Best Practices | 8/10 | Typecheck clean, lint clean; console.log in email handlers; unused imports |
| Mission Alignment | 8/10 | Core flows complete; programmes/assignments/documents UI not yet built |
| Functional Correctness | 7/10 | Double-booking bug is the one critical gap; auth + cascades are solid |
| UI/UX & Responsive | 7/10 | Mobile-first, good empty/loading states; i18n gaps and a11y issues |
| **Overall** | **7.4/10** | Production-ready for MVP with the double-booking fix applied |

---

## Phase 1: First Principles

### GT1 — Software Serves Humans (dead code, orphan links)

**Result: PASS**

All sidebar nav items in both portal (`components/portal/sidebar.tsx`) and admin (`components/admin/sidebar.tsx`) map to implemented pages. No orphan routes found. No unused exported components detected in a spot check.

---

### GT2 — State Defines Behavior / SSOT

**Result: 2 VIOLATIONS**

#### Violation 1 — Duplicate mood labels
`app/[locale]/(portal)/check-ins/edit-check-in-modal.tsx:8-14` defines a local `moodLabels` object with hardcoded English strings (`"Very low"`, `"Low"`, etc.). The canonical source is `lib/constants.ts` (`MOOD_LABEL`, `MOOD_EMOJI`). This component should import from constants and use `t()` for translated display.

```ts
// WRONG — edit-check-in-modal.tsx:8
const moodLabels: Record<string, string> = {
  very_low: "Very low",
  ...
}
```

#### Violation 2 — Duplicate mood numeric scale
`app/[locale]/(portal)/dashboard/mood-chart.tsx:7-13` defines `MOOD_VALUES` mapping mood enum → 1-5. The canonical source is `lib/constants.ts:MOOD_NUMERIC` (0–1 scale). Different scale, same concept, duplicated structure. Should derive from `MOOD_NUMERIC` or be justified and documented.

**Fix**: In `edit-check-in-modal.tsx`, remove the local object and call `t(\`moodValues.${mood}\`)` (or use `MOOD_LABEL` from constants). In `mood-chart.tsx`, import and adapt `MOOD_NUMERIC` rather than redefining.

---

### GT3 — Design for Change (modularity, file sizes)

**Result: 6 FILES OVER LIMIT**

CLAUDE.md specifies: pages ≤ 200 lines, components ≤ 150 lines. Files found in violation:

| File | Lines | Over by |
|------|-------|---------|
| `app/[locale]/(portal)/profile/profile-form.tsx` | 278 | +128 |
| `app/[locale]/(portal)/check-in/page.tsx` | 249 | +49 |
| `app/[locale]/(portal)/dashboard/page.tsx` | 234 | +34 |
| `app/[locale]/(portal)/dashboard/symptoms-chart.tsx` | 223 | +73 |
| `app/[locale]/(portal)/dashboard/wellness-trend-chart.tsx` | 208 | +58 |
| `app/[locale]/(privacy)/page.tsx` | 206 | +6 |

The two chart files are SVG-heavy; their verbosity is structural (path/gradient/dot rendering). The check-in page could extract a `<SymptomSection />` component. The profile form could extract step-specific sub-forms.

---

### GT4 — Automate the Mechanical

**Result: PASS**

`package.json` has scripts for lint, typecheck, build, dev, db:push, db:generate, db:studio, lint:umlauts. No obvious automation gaps.

---

### GT5 — Simplicity Scales

**Result: PASS**

No unnecessary abstraction layers or premature generalizations found. Domain logic lives in `lib/domain/`, API routes are thin wrappers, components handle rendering only.

---

### GT6 — Correctness Beats Speed

**Result: ISSUES FOUND**

- 16 `console.*` statements across email handlers and auth routes (acceptable in dev, but should be suppressed or replaced with a logging service in production). Worst case: `app/api/auth/forgot-password/route.ts:53` logs the raw reset token in development.
- 2 unused imports: `services` in `app/api/bookings/[id]/route.ts:5`; `SITE_URL` in `lib/domain/messaging.ts:7`.
- React purity: `new Date(Date.now() - THIRTY_DAYS_MS)` in `app/[locale]/(portal)/dashboard/page.tsx:32` is called during server component render. In a server component this is safe (no re-renders), but linters may flag it depending on config.

---

## Phase 2: Best Practices

### TypeScript

**Result: PASS — 0 errors**

`npx tsc --noEmit` exits 0 with no output.

### ESLint

**Result: PASS — 0 errors, 0 warnings**

`npm run lint` exits clean.

### API Response Format

**Result: PASS**

All API routes consistently return `{ success: boolean, data?: T }` or `{ success: false, error: string }`. Verified across `/api/profile`, `/api/threads`, `/api/bookings/[id]`, `/api/admin/services`, and 10+ others.

### Admin Authorization

**Result: PASS**

All routes under `app/api/admin/` check `session.user.role !== "admin" && session.user.role !== "practitioner"` before proceeding. Admin layout at `app/[locale]/(admin)/layout.tsx` redirects non-admins. `proxy.ts` blocks client-role users from `/admin/*` paths.

### Naming Conventions

**Result: PASS**

Components PascalCase, utilities camelCase, constants UPPER_SNAKE_CASE, config files kebab-case. No violations found.

### Magic Numbers

**Result: SUBSTANTIALLY RESOLVED**

All previously hardcoded numbers are now in `lib/constants.ts`: `DAY_MS`, `THIRTY_DAYS_MS`, `SEVEN_DAYS_MS`, `CHART_W/H/PAD`, `MOOD_NUMERIC`, `SYMPTOM_SCALE`, `RECENT_CHECK_INS_LIMIT`, `RECENT_CLIENTS_LIMIT`, `AT_RISK_CLIENTS_LIMIT`, `SLEEP_CHART_MAX_HOURS`, `CHART_TOOLTIP_RIGHT_THRESHOLD`, `CHART_TOOLTIP_LEFT_THRESHOLD`.

Minor remaining: `mood-chart.tsx:35` has `MAX_VALUE = 5` (local const, acceptable); `mood-chart.tsx:54` has `8` as minimum bar height percentage (visual only, acceptable inline).

### Pagination

**Result: MOSTLY COMPLIANT**

All major list endpoints use `PAGINATION_DEFAULT` or named limit constants. Intentionally unbounded: `app/api/account/export/route.ts` (user data export — correct by design), `app/api/admin/services/route.ts` (reference data, expected to be small). Admin leads page and at-risk query load all matching rows — acceptable at current scale, worth revisiting at 1000+ clients.

---

## Phase 3: Mission Alignment

This is a clinical health portal for burnout/Long-COVID reintegration. Assessment against product goals:

| Area | Status | Notes |
|------|--------|-------|
| Client check-in flow | **Implemented** | Mood, energy, sleep, reflections, symptoms — all fields, Zod-validated, duplicate-check |
| Dashboard feedback | **Implemented** | Wellness trend, sleep trend, symptoms chart, streak, onboarding prompt |
| Practitioner client list | **Implemented** | Paginated, profile data, check-in history, at-risk flagging |
| Practitioner notes per check-in | **Implemented** | Inline textarea, saved to DB, shown to client |
| Messaging system | **Implemented** | Full threading, email notifications, proper scope guards |
| Booking flow | **Implemented** | Services list, date/time preference, calendar view, confirm/cancel |
| At-risk flagging | **Implemented** | 7-day threshold, energy < 3 detection, dashboard widget |
| Services admin | **Implemented** | CRUD, toggle availability, category labels |
| Multilingual (DE/EN/FR) | **Implemented** | All portal + admin strings in messages/*.json |
| Swiss clinical context | **Implemented** | Professional tone, GDPR-appropriate, clinic terminology |
| AI readiness | **Planned** | `embedding vector(1536)` on profiles, check_ins, documents; `aiInsight text` on check_ins |
| Practitioner assignments | **Not Yet** | Schema exists (`assignments` table); no UI |
| Programmes management | **Not Yet** | Schema exists (`programs`, `programEnrollments`); no UI to create/manage |
| Document upload | **Not Yet** | Schema exists (`documents` table); no UI |
| Embedding generation | **Not Yet** | Infrastructure ready; no generation code |

**Clinical data gap**: Long-COVID-specific symptom tracking (orthostatic intolerance, post-exertional malaise severity, cognitive load, crash events) is not captured. The current `symptomFatigue/BrainFog/Pain/stressLevel` fields are a solid first layer; deeper Long-COVID-specific fields would increase clinical value.

---

## Phase 4: Improvement Roadmap

### Quick Wins (< 1 hour each)

1. **Fix double-booking bug** — `app/api/bookings/route.ts`: add a conflict query before insert.
2. **Remove unused imports** — `services` from `app/api/bookings/[id]/route.ts:5`, `SITE_URL` from `lib/domain/messaging.ts:7`.
3. **Fix hardcoded strings in check-ins/page.tsx** — lines 48, 55, 85, 91, 97, 122, 126, 131 — replace with `t()` calls; add keys to all 3 message files.
4. **Fix hardcoded strings in edit-check-in-modal.tsx** — lines 50, 61, 82 — replace with `t()` calls.
5. **Fix SSOT: mood labels in edit modal** — remove local `moodLabels` object, use `MOOD_LABEL` from constants.

### Medium Effort (1–5 hours each)

6. **Extract `<SymptomSection />`** from `check-in/page.tsx` — brings it from 249 → ~170 lines.
7. **Extract step sub-forms** from `profile-form.tsx` — brings it from 278 → ~150 lines.
8. **Increase touch targets** — `Button sm` variant is `h-8` (32px); increase to `h-10` or add padding.
9. **Add missing aria-labels** — Modal close button in `book/booking-grid.tsx:120`; translate sidebar aria-labels.
10. **Production logging** — wrap console calls in email handlers with an env-gated logger; fix token exposure in `forgot-password/route.ts:53`.
11. **SSOT fix: mood-chart.tsx** — derive from `MOOD_NUMERIC` instead of redefining `MOOD_VALUES`.

### Strategic Improvements

12. **Programmes UI** — Build create/edit/enroll UI. Schema is ready (`programs`, `programEnrollments`).
13. **Long-COVID symptom depth** — Add PEM tracking, activity tolerance, crash event logging to check-in.
14. **Embedding generation pipeline** — On check-in POST and profile save, generate `text-embedding-3-small` embedding and store in `embedding` column. Enables cohort analysis and similarity-based insights.
15. **Practitioner assignment UI** — Build UI to assign clients to specific practitioners.
16. **Document upload** — Build file upload flow with metadata stored in `documents` table.

---

## Phase 5: Functional Correctness

### Authentication & Authorization

- **Auth.js v5 + Drizzle adapter**: correctly configured at `lib/auth/index.ts`.
- **Session shape**: `{ user: { id, email, name, role, emailVerified } }` — used consistently across all routes.
- **JWT callback** calls `resolveRole()` on every sign-in to promote users in `ADMIN_EMAILS` env var. Works for both password and OAuth sign-in.
- **Proxy** (`proxy.ts`): redirects unauthenticated users to login, blocks clients from `/admin`, blocks authenticated users from auth pages.
- **Admin layout** (`app/[locale]/(admin)/layout.tsx`): additional guard redirects non-admin/practitioner to `/dashboard`.

### Critical Bug: Double-Booking Not Prevented

`app/api/bookings/route.ts` POST validates service availability but **does not check** whether a confirmed booking already exists for the same `(serviceId, preferredDate, preferredTime)` combination. Two clients can book the same slot simultaneously.

**Fix** (~line 42, after service validation):

```typescript
const conflicting = await db.query.bookings.findFirst({
  where: and(
    eq(bookings.serviceId, parsed.data.serviceId),
    eq(bookings.preferredDate, parsed.data.preferredDate ?? ""),
    eq(bookings.status, "confirmed")
  ),
})
if (conflicting) {
  return NextResponse.json({ success: false, error: "Slot already booked" }, { status: 409 })
}
```

### Check-in Flow

- Duplicate prevention (same calendar day): `app/api/check-in/route.ts:13-23` — correct.
- Zod validation: `checkInSchema` in `lib/domain/profile.ts` validates all fields including new symptom fields.
- DB insert: `...parsed.data` spreads all validated fields; Drizzle auto-converts camelCase → snake_case. New columns `symptom_fatigue`, `symptom_brain_fog`, `symptom_pain`, `stress_level` will be populated correctly.

### Data Integrity

All foreign keys in `lib/db/schema.ts` include `{ onDelete: "cascade" }`. Verified: `checkIns`, `bookings`, `threads`, `threadMessages`, `assignments`, `documents`, `programEnrollments`.

### API Routes — Auth + Validation Coverage

| Route | Auth check | Zod validation |
|-------|-----------|----------------|
| `POST /api/check-in` | ✅ session check | ✅ checkInSchema |
| `PATCH /api/bookings/[id]` | ✅ role check | ✅ partial status enum |
| `POST /api/admin/services` | ✅ admin/practitioner | ✅ serviceSchema |
| `PATCH /api/admin/services/[id]` | ✅ admin/practitioner | ✅ serviceUpdateSchema |
| `POST /api/threads` | ✅ session check | ✅ message body |
| `POST /api/profile` | ✅ session check | ✅ profileSchema |
| `POST /api/check-in/[id]/note` | ✅ admin/practitioner | ✅ practitionerNoteSchema |

---

## Phase 6: UI/UX & Responsive Design

### Responsive Design

**Result: SOLID FOUNDATION with minor gaps**

Mobile-first approach is consistent: base Tailwind classes target mobile, `md:`/`lg:` add larger breakpoints. Mobile navigation is implemented in both portal and admin sidebars with overlay menus and hamburger buttons (`components/portal/sidebar.tsx:89-106`, `components/admin/sidebar.tsx:88-102`). Admin tables have `overflow-x-auto` wrapper.

Hardcoded arbitrary values (minor): `w-[420px]` on auth sidebar (`auth/layout.tsx:14`), `pt-[5.5rem]` on portal/admin layouts (mobile top-bar offset — structural, acceptable), `min-w-[120px]` / `min-w-[130px]` on chart tooltips.

### Loading States

**Result: COMPLETE**

`loading.tsx` files found for all major routes: `/dashboard`, `/check-in`, `/profile`, `/check-ins`, `/book`, and admin equivalents. All use animated skeleton placeholders.

### Empty States

**Result: COMPLETE**

All major list pages handle zero-data state with helpful copy and CTAs. Portal check-ins, admin clients, admin bookings, messages all handled.

### i18n Gaps (Hardcoded English Strings)

**Result: 13 VIOLATIONS**

| File | Line(s) | Hardcoded string |
|------|---------|-----------------|
| `check-ins/page.tsx` | 45 | `"check-in${total !== 1 ? "s" : ""} total"` |
| `check-ins/page.tsx` | 48 | `"New check-in"` |
| `check-ins/page.tsx` | 55 | `"Do your first check-in"` |
| `check-ins/page.tsx` | 85 | `"Wins"` |
| `check-ins/page.tsx` | 91 | `"Challenges"` |
| `check-ins/page.tsx` | 97 | `"Notes"` |
| `check-ins/page.tsx` | 122 | `"Page {page} of {totalPages}"` |
| `check-ins/page.tsx` | 126 | `"← Previous"` |
| `check-ins/page.tsx` | 131 | `"Next →"` |
| `edit-check-in-modal.tsx` | 61 | `"Mood"` |
| `edit-check-in-modal.tsx` | 82 | `"Energy: {n}/10"` |
| `edit-check-in-modal.tsx` | 50 | `"Could not save. Please try again."` |
| `check-in-actions.tsx` | 25 | `"Could not delete. Please try again."` |

### Accessibility

**Touch targets**: `Button sm` variant is `h-8` (32px), below the 44px WCAG minimum. Used on pagination in `check-ins/page.tsx:126-131` and admin clients list.

**Aria-labels missing**: Modal close button in `book/booking-grid.tsx:120` (X icon, no `aria-label`). Admin sidebar aria-labels (`"Open menu"` / `"Close menu"`) are hardcoded English, not translated.

**Focus states**: All interactive elements have visible focus rings via `focus-visible:ring-2`. ✅

**Form labels**: All inputs have associated `<label>` elements. ✅

---

## Action Items

### P0 — Fix Before Next User-Facing Release

1. **Double-booking prevention** — `app/api/bookings/route.ts` ~line 42: add conflict check before insert. ~30 min.

### P1 — Fix This Sprint

2. **i18n: check-ins/page.tsx** — lines 48, 55, 85, 91, 97, 122, 126, 131: replace all hardcoded English with `t()` calls + add keys to DE/FR/EN message files. ~45 min.
3. **i18n + SSOT: edit-check-in-modal.tsx** — lines 50, 61, 82: replace hardcoded strings; remove local `moodLabels` object, use `MOOD_LABEL` from constants + `t()`. ~30 min.
4. **i18n: check-in-actions.tsx:25** — replace `"Could not delete."` with `t("error")`. ~10 min.
5. **Remove unused imports** — `services` from `app/api/bookings/[id]/route.ts:5`; `SITE_URL` from `lib/domain/messaging.ts:7`. ~5 min.

### P2 — Schedule This Month

6. **Touch targets** — Increase `Button sm` to `h-10` minimum, or increase padding on pagination buttons.
7. **Aria-labels** — Modal close in `booking-grid.tsx:120`; translate sidebar menu toggle labels.
8. **Component size: check-in/page.tsx** — Extract `<SymptomSection />` component (lines 193–239).
9. **Component size: profile-form.tsx** — Extract step-specific sub-forms.
10. **SSOT: mood-chart.tsx** — Derive from `MOOD_NUMERIC`; remove duplicate `MOOD_VALUES`.
11. **Production logging** — Env-gated logger wrapper for console calls; especially `forgot-password/route.ts:53` (token logged).

### P3 — Backlog

12. Build Programmes UI (schema ready).
13. Expand Long-COVID symptom depth (PEM, activity tolerance, crash events).
14. Embedding generation pipeline (OpenAI `text-embedding-3-small` on check-in save + profile update).
15. Practitioner assignment UI.
16. Document upload flow.
