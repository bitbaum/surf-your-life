import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { API_ERR_UNAUTHORIZED, FIELD_MAX_MEDIUM } from "@/lib/constants"
import { parseBody } from "@/lib/api"
import { aiParse, keywordParse } from "@/lib/domain/check-in-parse"

const parseSchema = z.object({
  text: z.string().min(1).max(FIELD_MAX_MEDIUM),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const result = await parseBody(req, parseSchema)
  if (!result.ok) return result.response

  const fields = (await aiParse(result.data.text)) ?? keywordParse(result.data.text)

  return NextResponse.json({ success: true, data: fields })
}
