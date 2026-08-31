export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

// Public health check (fleet convention): 200 = the app is up AND its database
// answers. Deploy monitoring curls this after every push — a status code is the
// contract, the body is for humans. The body never exposes internals; the
// detail goes to the logs, where the person fixing it is already looking.
export async function GET() {
  try {
    await db.execute(sql`select 1`);
  } catch (err) {
    console.error("[api/health] database unreachable:", err);
    return NextResponse.json({ success: false, error: "database unreachable" }, { status: 503 });
  }

  return NextResponse.json({ success: true });
}
