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
import {
  complete,
  freeChain,
  usableChain,
  createHealthTracker,
  createAiHealthHandler,
} from "@bitbaum/ai-kit";

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

/**
 * The AI liveness handler, behind `/api/health/ai`.
 *
 * WHY THIS EXISTS. `getLLMHealth()` reports what happened the last time this
 * app happened to call a model. Straight after a deploy that is "unknown", and
 * "unknown" is what it stays until real traffic arrives — so the one question a
 * deploy needs answered is exactly the one it cannot answer. Observed on the
 * 0.7.0 deploy: green CI, both keys present, `/api/health` 200, `llm.status`
 * "unknown". The only paths that would have produced a real answer were the
 * admin-authenticated planner and two crons that email real users.
 *
 * BUILT LAZILY, ON PURPOSE. Next evaluates module-level code during the BUILD,
 * where the runtime's provider keys are absent. Constructing the chain up there
 * would bake in an empty one, and the route would report a dead engine forever
 * on a deployment whose keys are fine.
 *
 * It shares the tracker above, so one probe also answers the next ordinary
 * `/api/health` poll instead of its knowledge dying with the request.
 */
let aiHealth: ((request: Request) => Promise<Response>) | null = null;

export function aiHealthHandler(request: Request): Promise<Response> {
  aiHealth ??= createAiHealthHandler({
    chain: usableChain(freeChain("SURF"), process.env),
    health,
    secret: process.env.AI_PROBE_SECRET,
  });
  return aiHealth(request);
}
