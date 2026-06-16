# Surf Your Life

A psychiatry-led clinic portal (Zürich) helping people recover from burnout and Long COVID.
Clients track their recovery — daily check-ins, symptoms, sleep, techniques — and practitioners
get the visibility they need to intervene early, run evidence-based programs, and analyze progress.

## Stack

- **Next.js 16** (App Router, Server Components) · TypeScript strict
- **PostgreSQL** (self-hosted) + **Drizzle ORM** + **pgvector**
- **Auth.js v5** (Google OAuth + email/password)
- **Tailwind v4** · **next-intl** (de / en / fr)
- Self-hosted on Hetzner (behind Caddy)

## Getting Started

```bash
pnpm install
cp .env.example .env.local   # fill in DATABASE_URL, AUTH_SECRET, etc.
pnpm db:migrate              # apply migrations
pnpm dev                     # http://localhost:3000
```

## Scripts

```bash
pnpm dev          # dev server
pnpm build        # production build (output: standalone)
pnpm start        # run the standalone build
pnpm test         # vitest
pnpm lint         # eslint
pnpm db:generate  # generate a migration from schema changes
pnpm db:migrate   # apply migrations
pnpm db:studio    # drizzle studio
```

## Project layout

See [`CLAUDE.md`](./CLAUDE.md) for architecture, design-system tokens, and engineering conventions.
