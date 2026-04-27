import { NextResponse } from "next/server"
import { z } from "zod"
import { FIELD_MAX_MEDIUM } from "@/lib/constants"
import { parseBody, requireAuth } from "@/lib/api"
import { aiParse, keywordParse } from "@/lib/domain/check-in-parse"

const parseSchema = z.object({
  text: z.string().min(1).max(FIELD_MAX_MEDIUM),
})

export async function POST(req: Request) {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response

  const result = await parseBody(req, parseSchema)
  if (!result.ok) return result.response

  const fields = (await aiParse(result.data.text)) ?? keywordParse(result.data.text)

  return NextResponse.json({ success: true, data: fields })
}
