/**
 * Chat completion via the fleet's shared AI engine.
 *
 * This used to be a bespoke Anthropic-only client, then a hand-rolled walk of
 * `ai-kit`'s chain with its own `fetch`. The chain logic came from the package;
 * the REQUEST did not, and that is where the remaining bugs lived. `complete()`
 * (ai-kit >= 0.7.0) owns both, so this file no longer decides anything about
 * how a model is called.
 *
 * What the swap actually buys, none of which the local loop did:
 *   - a DAILY 429 now skips the rest of that vendor instead of trying its other
 *     models against the same exhausted org-wide budget,
 *   - a SIZE 429 stops the walk instead of demoting to a model with a SMALLER
 *     ceiling, which is strictly worse,
 *   - the vendor's response BODY survives into the error, so an exhausted day
 *     is distinguishable from a momentary burst in a log.
 *
 * The manual "one link per vendor" filter is gone with it. It existed because a
 * second model at the same vendor shares the daily budget — true, but only for
 * the DAILY case, and dropping those links also threw away the retry that
 * rescues a rotted or momentarily busy model. `complete()` makes that
 * distinction per failure kind instead of up front.
 *
 * Same graceful-degrade contract as before: returns null on any failure
 * (no key configured, every vendor refused) rather than throwing, because
 * every caller here already treats a null response as "fall back to the
 * non-AI path," not as an error to surface.
 */
import { complete, freeChain, usableChain, createHealthTracker } from "@bitbaum/ai-kit";

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
  const chain = usableChain(freeChain("SURF"), process.env);
  if (chain.length === 0) return null;

  try {
    const result = await complete({
      chain,
      health,
      // The chain leads with REASONING models, which spend this budget thinking
      // before emitting a visible token. Too low and a healthy model returns an
      // empty completion, which ai-kit correctly treats as a failure — so a mean
      // budget makes the whole chain look dead. 500 is the existing default and
      // is comfortably above the ~256 floor measured for a short answer.
      maxTokens,
      messages: system ? [{ role: "system", content: system }, ...messages] : messages,
    });
    return result.text;
  } catch {
    // ChainExhaustedError or an empty chain — every caller treats null as
    // "fall back," matching the contract this replaces.
    return null;
  }
}
