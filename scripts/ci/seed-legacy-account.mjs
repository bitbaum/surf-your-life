#!/usr/bin/env node
/**
 * CI only: one account as Auth.js left it — a `users` row with a bcrypt hash
 * and no shared rows — written before scripts/db/accountkit-import.sql runs,
 * so the browser journey proves an imported account signs in on AccountKit's
 * form with its old password. Synthetic address and password, from env.
 *
 *   DATABASE_URL=… LEGACY_EMAIL=… LEGACY_PASSWORD=… node scripts/ci/seed-legacy-account.mjs
 */
import bcrypt from "bcryptjs";
import pg from "pg";

const { DATABASE_URL, LEGACY_EMAIL, LEGACY_PASSWORD } = process.env;
if (!DATABASE_URL || !LEGACY_EMAIL || !LEGACY_PASSWORD) {
  console.error("set DATABASE_URL, LEGACY_EMAIL and LEGACY_PASSWORD");
  process.exit(2);
}
const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
try {
  // Auth.js's own cost factor (lib/constants.ts BCRYPT_SALT_ROUNDS).
  const hash = await bcrypt.hash(LEGACY_PASSWORD, 12);
  await client.query(
    `INSERT INTO users (email, name, password, role, email_verified)
     VALUES ($1, 'Legacy Person', $2, 'practitioner', now())`,
    [LEGACY_EMAIL, hash],
  );
  console.log("seeded 1 legacy account (bcrypt, role practitioner)");
} finally {
  await client.end();
}
