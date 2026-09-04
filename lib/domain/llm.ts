/**
 * Chat completion via the fleet's shared AI provider chain (Groq -> OpenRouter).
 *
 * This used to be a bespoke Anthropic-only client, the one hand-rolled
 * provider in a fleet where everything else installs `ai-kit`. It needed its
 * own `ANTHROPIC_API_KEY` — a credential this fleet doesn't otherwise carry —
 * so every caller degraded (silently, by design) on every deployment that
 * only ever had GROQ_API_KEY / OPENROUTER_API_KEY set, which is all of them.
 *
 * Same graceful-degrade contract as before: returns null on any failure
 * (no key configured, every vendor refused) rather than throwing, because
 * every caller here already treats a null response as "fall back to the
 * non-AI path," not as an error to surface.
 */
import { freeChain, usableChain, chainFrom, tryChain, createHealthTracker } from "@bitbaum/ai-kit";

const health = createHealthTracker({ downAfter: 3 });

export function getLLMHealth() {
  return health.getHealth();
}

type Message = { role: "user" | "assistant"; content: string };

type CallOptions = {
  messages: Message[];
  system?: string;
  maxTokens?: number;
  /** Vendor-specific model id. Ignored — model choice comes from the chain. */
  model?: string;
};

/**
 * Call the chain and return the text of the first choice, or null on
 * failure (no provider configured, or every provider in the chain refused).
 */
export async function callLLM({
  messages,
  system,
  maxTokens = 500,
}: CallOptions): Promise<string | null> {
  const links = usableChain(freeChain("SURF"), process.env);
  if (links.length === 0) return null;

  // One link per vendor — a second model at the same vendor draws on the
  // same daily budget, so it is not a real fallback. @see ai-kit chain.ts
  const seen = new Set<string>();
  const chain = links.filter((link) => {
    if (seen.has(link.provider.id)) return false;
    seen.add(link.provider.id);
    return true;
  });

  try {
    return await tryChain(chain, {
      health,
      attempt: async (link) => {
        const [resolved] = chainFrom(undefined, [link]);
        const res = await fetch(`${link.provider.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env[link.provider.keyEnv] ?? ""}`,
          },
          body: JSON.stringify({
            model: resolved?.model ?? link.model,
            max_tokens: maxTokens,
            messages: system ? [{ role: "system", content: system }, ...messages] : messages,
          }),
        });

        if (!res.ok) {
          // Body goes on the thrown error for the log only — never returned.
          const detail = await res.text().catch(() => "");
          throw new Error(
            `${link.provider.id} chat failed (${res.status}): ${detail.slice(0, 200)}`,
          );
        }

        const body = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = body.choices?.[0]?.message?.content;
        if (!text) throw new Error(`${link.provider.id} returned no content`);
        return text;
      },
    });
  } catch {
    // ChainExhaustedError or an empty chain — every caller treats null as
    // "fall back," matching the contract this replaces.
    return null;
  }
}
