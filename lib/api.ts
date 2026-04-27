import { NextResponse } from "next/server"
import type { ZodTypeAny, infer as ZodInfer } from "zod"
import type { Session } from "next-auth"
import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { API_ERR_FORBIDDEN, API_ERR_INVALID_INPUT, API_ERR_UNAUTHORIZED } from "@/lib/constants"

type ParseOk<T> = { ok: true; data: T }
type ParseFail = { ok: false; response: NextResponse }

type AuthOk = { ok: true; session: Session }
type AuthFail = { ok: false; response: NextResponse }

export async function requireAuth(): Promise<AuthOk | AuthFail> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, response: NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 }) }
  return { ok: true, session }
}

export async function requireStaffAuth(): Promise<AuthOk | AuthFail> {
  const session = await auth()
  if (!session) return { ok: false, response: NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 }) }
  if (!isStaff(session.user.role)) return { ok: false, response: NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 }) }
  return { ok: true, session }
}

export async function parseBody<S extends ZodTypeAny>(
  req: Request,
  schema: S
): Promise<ParseOk<ZodInfer<S>> | ParseFail> {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return { ok: false, response: NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 }) }
  }
  return { ok: true, data: parsed.data }
}
