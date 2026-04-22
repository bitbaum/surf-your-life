/**
 * Parse a free-text description of a day into structured check-in fields.
 *
 * AI path (when ANTHROPIC_API_KEY is set): calls Claude for accurate extraction.
 * Fallback: keyword-based heuristics grounded in common English patterns.
 *
 * Returns partial check-in fields — only fields it's confident about.
 * The client form pre-fills these and lets the user review before submitting.
 */
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { callClaude } from "@/lib/domain/anthropic"
import { API_ERR_INVALID_INPUT, API_ERR_UNAUTHORIZED } from "@/lib/constants"

const parseSchema = z.object({
  text: z.string().min(1).max(1000),
})

type ParsedFields = {
  mood?: string
  energyLevel?: number
  sleepHours?: number
  activityLevel?: string
  pemFlag?: boolean
  orthostaticSymptoms?: boolean
  journalEntry?: string
}

// ─── Keyword parser (no API key needed) ──────────────────────────────────────

function keywordParse(text: string): ParsedFields {
  const t = text.toLowerCase()
  const result: ParsedFields = {}

  // Always set journalEntry to the full text — user typed it as a journal
  result.journalEntry = text.trim()

  // ── Mood ────────────────────────────────────────────────────────────────────
  if (/\b(terrible|awful|horrible|miserable|devastat|rock.?bottom|worst)\b/.test(t)) {
    result.mood = "very_low"
  } else if (/\b(bad|rough|tough|hard|struggling|difficult|not great|feel.{0,10}low|down)\b/.test(t)) {
    result.mood = "low"
  } else if (/\b(okay|ok|fine|alright|neutral|so.?so|average|meh|manageable)\b/.test(t)) {
    result.mood = "neutral"
  } else if (/\b(good|well|decent|pretty good|better|improv|positive)\b/.test(t)) {
    result.mood = "good"
  } else if (/\b(great|amazing|wonderful|fantastic|excellent|brilliant|wonderful)\b/.test(t)) {
    result.mood = "excellent"
  }

  // ── Energy — explicit number first, then adjective ─────────────────────────
  const energyNumMatch = t.match(/energy[^0-9]{0,15}([1-9]|10)\b|([1-9]|10)\s*\/\s*10\s*(energy|out of)/i)
  if (energyNumMatch) {
    const n = parseInt(energyNumMatch[1] ?? energyNumMatch[2])
    if (n >= 1 && n <= 10) result.energyLevel = n
  } else if (/\b(no energy|zero energy|drained|depleted|completely exhausted)\b/.test(t)) {
    result.energyLevel = 2
  } else if (/\b(exhausted|very tired|wiped out|spent|very low energy)\b/.test(t)) {
    result.energyLevel = 3
  } else if (/\b(tired|low energy|fatigued|sluggish)\b/.test(t)) {
    result.energyLevel = 4
  } else if (/\b(moderate energy|okay energy|half.?decent)\b/.test(t)) {
    result.energyLevel = 5
  } else if (/\b(decent energy|reasonable energy|not bad energy)\b/.test(t)) {
    result.energyLevel = 6
  } else if (/\b(good energy|energised|energized|quite good)\b/.test(t)) {
    result.energyLevel = 7
  } else if (/\b(great energy|high energy|lots of energy|full of energy)\b/.test(t)) {
    result.energyLevel = 9
  }

  // ── Sleep hours — number + hours/h pattern ─────────────────────────────────
  const sleepMatch = t.match(/slept\s+(about\s+)?(\d+(?:\.\d)?)\s*(?:hours?|hrs?|h\b)/) ??
                     t.match(/(\d+(?:\.\d)?)\s*(?:hours?|hrs?|h\b)\s*(of\s+)?sleep/) ??
                     t.match(/sleep[^0-9]{0,10}(\d+(?:\.\d)?)/)
  if (sleepMatch) {
    const h = parseFloat(sleepMatch[sleepMatch.length - 1])
    if (h >= 0 && h <= 24) result.sleepHours = Math.round(h)
  }

  // ── Activity level ──────────────────────────────────────────────────────────
  if (/\b(bed.?rest|stayed in bed|complete rest|no activity|resting all day|bedbound)\b/.test(t)) {
    result.activityLevel = "rest"
  } else if (/\b(short walk|gentle walk|light walk|gentle movement|light activity|easy day)\b/.test(t)) {
    result.activityLevel = "light"
  } else if (/\b(walked|some activity|moderate|working|housework|errands|drove|light exercise)\b/.test(t)) {
    result.activityLevel = "moderate"
  } else if (/\b(exercise|gym|run|ran|workout|bike|cycling|swim|very active|busy day)\b/.test(t)) {
    result.activityLevel = "active"
  }

  // ── PEM ─────────────────────────────────────────────────────────────────────
  if (/\b(pem|post.?exertional|crashed after|crash after|worse after|flare after|payback)\b/.test(t)) {
    result.pemFlag = true
  }

  // ── Orthostatic symptoms ────────────────────────────────────────────────────
  if (/\b(dizzy|dizziness|lightheaded|light.?headed|dizzy.{0,20}stand|stood up.{0,20}dizzy|vertigo)\b/.test(t)) {
    result.orthostaticSymptoms = true
  }

  return result
}

// ─── AI parser (to enable: set ANTHROPIC_API_KEY) ────────────────────────────

async function aiParse(text: string): Promise<ParsedFields | null> {
  const prompt = `Extract structured health data from this daily check-in description.
Return ONLY valid JSON with these optional fields (omit any you're not confident about):
- mood: "very_low" | "low" | "neutral" | "good" | "excellent"
- energyLevel: integer 1-10
- sleepHours: integer 0-24
- activityLevel: "rest" | "light" | "moderate" | "active"
- pemFlag: boolean (true if post-exertional malaise / crash after activity)
- orthostaticSymptoms: boolean (true if dizziness on standing)
- journalEntry: the full input text, cleaned up

Input: "${text.replace(/"/g, '\\"')}"

JSON only, no explanation:`

  try {
    const raw = await callClaude({ messages: [{ role: "user", content: prompt }], maxTokens: 200 })
    if (!raw) return null
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    return JSON.parse(jsonMatch[0]) as ParsedFields
  } catch {
    return null
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

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
