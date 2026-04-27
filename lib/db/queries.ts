import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/** Fetch name + email for a user — used when sending email notifications. */
export async function findUserContact(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
    columns: { name: true, email: true },
  })
}
