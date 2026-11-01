# AccountKit migration staging

Surf Your Life still signs in through Auth.js (`lib/auth/index.ts`). Migration
`drizzle/0029_accountkit_staging.sql` adds AccountKit's tables beside it under
the `auth_` prefix (`createAuthTables("auth_")` in `lib/db/accountkit.ts`),
because Auth.js already owns `users`, `accounts` and `sessions`. Nothing reads
or writes them yet. The migration was written by hand: this repository's
Drizzle snapshots stop at 0002, so `drizzle-kit generate` would emit the whole
schema again. The fleet's acceptance queue is
[Fleet's checkpoint](https://github.com/bitbaum/fleet/blob/main/docs/remediation-resume-2026-10-29.md).

## Rehearse the import

Against an isolated database holding an authorised snapshot, after every
migration:

```sh
DATABASE_URL=postgres://… pnpm run db:rehearse-import
```

It runs `scripts/db/accountkit-import.sql` in one transaction, always rolls
back, and prints only counts. There is no apply mode. It takes locks even
though it rolls back, so never point it at the served database.

The import keeps each `users.id` as the shared user id, so sessions,
check-ins and messages keep pointing at the same person. Addresses are
lower-cased and their verification is kept. bcrypt hashes are copied byte for
byte and sign in through `legacyBcrypt`. An `orangecat_sub` becomes an
`orangecat` account row, the pair AccountKit's OIDC sign-in looks up. Roles
stay on `users`. Google links in Auth.js's `accounts` table are not carried
over: Google is mounted only with its client pair, which production does not
have, and AccountKit reaches Google through the bitbaum sign-in. Two addresses that collide once lower-cased,
drift between runs, or an already-used shared runtime fail the transaction.

The import finally attaches the mirror triggers defined in migration 0029.
From then on every Surf Your Life writer of `users` keeps `auth_users` and the
credential row in step: registration, the reset link, the password change,
account deletion and admin edits. A password change ends every
other shared session; `/api/auth/change-password` names its own session in
`surf.keep_session`, so the person changing it stays signed in. A reset
ends every session.

## Shared runtime (built, off)

With `AUTH_RUNTIME=accountkit` the runtime in `lib/auth/shared/` answers every
sign-in; unset, Auth.js answers as today. The secret is `BETTER_AUTH_SECRET`,
or the `AUTH_SECRET` the box already holds. Absolute URLs use `AUTH_URL`, which
production already sets.

- `auth()` keeps today's session shape (`id`, `role`, `emailVerified`, `name`).
  It is read from the shared session and the `users` row on every request, so
  a role change or a rename applies on the next request. `ADMIN_EMAILS`
  promotes at a password sign-in, never for OrangeCat, and never demotes
  (`lib/auth/claims.ts`, the same rule the Auth.js jwt callback now uses).
  Before, with `ADMIN_EMAILS` set, every password sign-in wrote back
  `resolveRole`, which knows only admin and client, so a practitioner was
  demoted at their next sign-in.
- The pages keep `next-auth/react`. AccountKit's compat layer
  (`@bitbaum/accountkit/auth/nextauth-compat`, configured in
  `lib/auth/shared/compat.ts`) answers its calls from the shared runtime:
  `session` GET and POST, `csrf`, `providers`, `signout`,
  `callback/credentials` and `signin/orangecat`. Of AccountKit's own endpoints
  only the session, sign-in, sign-out and the OAuth callback are open. Its
  sign-up, reset and password endpoints stay closed until Surf Your Life adopts its
  screens, so there is no second credential writer.
- A person AccountKit creates itself (a first OrangeCat sign-in) gets a
  Surf Your Life row under the same id (`lib/auth/shared/accounts.ts`), as a client
  with an unverified address.

`lib/auth/shared/__tests__/journeys.test.ts` runs these through the real
handlers on the replayed migration chain and the real import. CI's
`browser-smoke.yml` account job runs the rehearsal and those journeys, then the
whole browser account journey once per runtime. That is not deployed evidence.

## Before switching

1. **OrangeCat callback.** Done: OrangeCat accepts AccountKit's
   `/api/auth/oauth2/callback/orangecat` for client `surf-your-life` beside the
   Auth.js one (orangecat#1508, live).
2. Stop Surf Your Life's credential writes, import once under locks, then set
   `AUTH_RUNTIME=accountkit`. Everyone signed in under Auth.js signs in again
   once. To roll back, unset `AUTH_RUNTIME` and drop the two triggers. Every
   hash stays bcrypt in `users.password`, so nothing needs a reset.
3. Prove sign-in, recovery, an OrangeCat sign-in, a role change and revocation
   on the deployed artifact with an approved test identity.
