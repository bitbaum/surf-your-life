import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { serviceSchema } from "@/lib/domain/services";
import { asc } from "drizzle-orm";
import { SERVICES_MAX_LIMIT } from "@/lib/constants";
import { created, parseBody, requireStaffAuth } from "@/lib/api";

export async function GET() {
  const authResult = await requireStaffAuth();
  if (!authResult.ok) return authResult.response;

  const data = await db
    .select()
    .from(services)
    .orderBy(asc(services.sortOrder), asc(services.name))
    .limit(SERVICES_MAX_LIMIT);
  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  const authResult = await requireStaffAuth();
  if (!authResult.ok) return authResult.response;

  const result = await parseBody(req, serviceSchema);
  if (!result.ok) return result.response;

  const [service] = await db
    .insert(services)
    .values({
      name: result.data.name,
      description: result.data.description ?? null,
      category: result.data.category,
      durationMinutes: result.data.durationMinutes ?? null,
      available: true,
      sortOrder: 0,
    })
    .returning();

  return created(service);
}
