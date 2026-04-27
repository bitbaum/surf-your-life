import { NextResponse } from "next/server"
import type { ZodTypeAny, infer as ZodInfer } from "zod"
import { API_ERR_INVALID_INPUT } from "@/lib/constants"

type ParseOk<T> = { ok: true; data: T }
type ParseFail = { ok: false; response: NextResponse }

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
