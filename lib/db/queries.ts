import { db } from "@/lib/db";
import { users, profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/** Fetch name + email for a user — used when sending email notifications. */
export async function findUserContact(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
    columns: { name: true, email: true },
  });
}

/** Fetch the full profile row for a user. */
export async function getUserProfile(userId: string) {
  return db.query.profiles.findFirst({ where: eq(profiles.userId, userId) });
}
