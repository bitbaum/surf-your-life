import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { API_ERR_INVALID_INPUT, API_ERR_UNAUTHORIZED, FIELD_MAX_MEDIUM } from "@/lib/constants"
import { aiParse, keywordParse } from "@/lib/domain/check-in-parse"

const parseSchema = z.object({
  text: z.string().min(1).max(FIELD_MAX_MEDIUM),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const body = await req.json()
  const parsed = parseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  const fields = (await aiParse(parsed.data.text)) ?? keywordParse(parsed.data.text)

  return NextResponse.json({ success: true, data: fields })
}
