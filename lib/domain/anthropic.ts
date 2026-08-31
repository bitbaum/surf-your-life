/**
 * Thin wrapper around the Anthropic Messages API.
 * Centralises auth headers, API version, and error handling.
 * Returns null on any failure — all callers gracefully degrade.
 */
import { AI_MODEL_FAST } from "@/lib/constants";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

type Message = { role: "user" | "assistant"; content: string };

type CallOptions = {
  messages: Message[];
  system?: string;
  maxTokens?: number;
  model?: string;
};

/**
 * Call Claude and return the text of the first content block, or null on failure.
 * Requires ANTHROPIC_API_KEY to be set — returns null otherwise.
 */
export async function callClaude({
  messages,
  system,
  maxTokens = 500,
  model = AI_MODEL_FAST,
}: CallOptions): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const body: Record<string, unknown> = {
      model,
      max_tokens: maxTokens,
      messages,
    };
    if (system) body.system = system;

    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.content?.[0]?.text ?? null;
  } catch {
    return null;
  }
}
