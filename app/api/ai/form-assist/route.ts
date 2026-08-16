/**
 * Form Assist API
 *
 * POST /api/ai/form-assist
 *
 * One route for every AI-assisted form in the app. Adding assistance to a new
 * form means adding it to AI_FORMS — nothing here changes.
 *
 * The field registry stays server-side on purpose: the client names a form,
 * never the fields, so it cannot widen what the model is allowed to write.
 *
 * Why this is hand-written instead of `createFormAssistHandler`: the package's
 * handler owns the request, and this app needs the raw instruction inside
 * `complete` so it can answer from the keyword parser when there is no
 * ANTHROPIC_API_KEY. Owning the request here is what keeps the check-in form
 * working on a deployment with no model at all — the property the previous
 * /api/check-in/parse route had and which a straight port would have deleted.
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { runFormAssist, type CompleteFn } from "@fleet/ai-forms"
import { requireAuth } from "@/lib/api"
import { AI_FORMS } from "@/lib/config/ai-forms"
import { API_ERR_INVALID_INPUT, FIELD_MAX_MEDIUM } from "@/lib/constants"
import { callClaude } from "@/lib/domain/anthropic"
import { keywordFallback } from "@/lib/domain/check-in-parse"

const requestSchema = z.object({
  target: z.string().min(1).max(64),
  intent: z.enum(["fill", "refine"]),
  instruction: z.string().min(1).max(FIELD_MAX_MEDIUM),
  values: z.record(z.string(), z.unknown()).optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(FIELD_MAX_MEDIUM) }))
    .max(20)
    .optional(),
  pageContext: z.string().max(FIELD_MAX_MEDIUM).optional(),
})

export async function POST(req: Request) {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response

  const body = await req.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  const { target: targetKey, intent, instruction, values, history, pageContext } = parsed.data
  const target = AI_FORMS.find((form) => form.key === targetKey)
  if (!target) {
    return NextResponse.json({ ok: false, error: `Unknown form "${targetKey}".` }, { status: 404 })
  }

  const complete: CompleteFn = async ({ system, prompt, maxTokens }) => {
    const text = await callClaude({
      messages: [{ role: "user", content: prompt }],
      system,
      maxTokens,
    })
    if (text) return text

    // No key, or the call failed. Answer from the keyword parser rather than
    // failing: the parser returns the same field names the model would, so
    // runFormAssist sanitises and merges it by exactly the same rules.
    return JSON.stringify({
      values: keywordFallback(instruction, intent),
      message: "Filled in from keywords — no AI model is configured, so check each answer.",
    })
  }

  const result = await runFormAssist({
    target,
    request: { intent, instruction, values, history, pageContext },
    complete,
  })

  // Deliberately NOT wrapped in this app's { success, data } envelope. The one
  // client is useAiForm, which reads the AssistResult straight off res.json()
  // (`result.ok`, `result.values`). Wrapping it typechecks and breaks at
  // runtime: the hook would see an object with no `ok` and report every
  // successful call as a failure.
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
