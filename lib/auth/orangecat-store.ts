import { and, eq, isNull, or, sql } from "drizzle-orm";
import type { AdapterUser } from "next-auth/adapters";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { OrangecatUserStore } from "./orangecat-identity";

type UserRow = typeof users.$inferSelect;

// Never hand the password hash to Auth.js.
function toAdapterUser(row: UserRow | undefined): AdapterUser | null {
  if (!row) return null;
  const { password: _password, ...user } = row;
  return user as AdapterUser;
}

/** users.orangecat_sub is the only thing an OrangeCat sign-in resolves on. */
export const orangecatUserStore: OrangecatUserStore = {
  async findBySub(sub) {
    return toAdapterUser(await db.query.users.findFirst({ where: eq(users.orangecatSub, sub) }));
  },
  async emailTaken(email) {
    const row = await db.query.users.findFirst({
      where: sql`lower(${users.email}) = ${email.toLowerCase()}`,
      columns: { id: true },
    });
    return Boolean(row);
  },
  async insert(user) {
    const [row] = await db.insert(users).values(user).returning();
    const created = toAdapterUser(row);
    if (!created) throw new Error("user insert returned no row");
    return created;
  },
  async attachSub(userId, sub) {
    const rows = await db
      .update(users)
      .set({ orangecatSub: sub })
      .where(and(eq(users.id, userId), or(isNull(users.orangecatSub), eq(users.orangecatSub, sub))))
      .returning({ id: users.id });
    return rows.length > 0;
  },
};
