#!/usr/bin/env bash
# Fails when replaying drizzle/*.sql onto an empty database does not give the
# schema lib/db/schema.ts declares. Needs two EMPTY databases on a server with
# pgvector; both are written to.
#
#   scripts/db/check-migration-drift.sh <migrated-url> <pushed-url>
set -euo pipefail
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"
cd "$(dirname "$0")/../.."

migrated="$1"
pushed="$2"

for url in "$migrated" "$pushed"; do
  psql "$url" -v ON_ERROR_STOP=1 -q -c "CREATE EXTENSION IF NOT EXISTS vector"
done

for file in drizzle/[0-9]*.sql; do
  psql "$migrated" -v ON_ERROR_STOP=1 -q -f "$file" > /dev/null
done
DATABASE_URL="$pushed" pnpm exec drizzle-kit push --force > /dev/null

catalog() { psql "$1" -v ON_ERROR_STOP=1 -At -f scripts/db/schema-catalog.sql; }
if diff -u --label "replayed drizzle/*.sql" --label "pushed lib/db/schema.ts" \
  <(catalog "$migrated") <(catalog "$pushed"); then
  echo "drizzle/*.sql replays to the schema in lib/db/schema.ts"
else
  echo "::error::drizzle/*.sql and lib/db/schema.ts disagree; add a migration for the lines above"
  exit 1
fi
