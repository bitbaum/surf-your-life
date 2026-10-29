import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { routing } from "@/i18n/routing";
import { AI_PROCESSORS } from "@/lib/domain/llm";

// Health data goes to every vendor in AI_PROCESSORS. The privacy policy, in
// every locale the site serves, must name each one with what is sent, why and
// on what basis — a vendor added to the code without the policy fails here.
type Block = { name?: string; role?: string; data?: string; purpose?: string };

function aiSection(locale: string): Record<string, unknown> {
  const p = resolve(process.cwd(), "messages", `${locale}.json`);
  const messages = JSON.parse(readFileSync(p, "utf8")) as {
    privacy: { ai: Record<string, unknown> };
  };
  return messages.privacy.ai;
}

describe.each(routing.locales)("privacy policy (%s)", (locale) => {
  const ai = aiSection(locale);

  it.each(AI_PROCESSORS)("names %s with role, data, purpose and the USA", (id) => {
    const block = ai[id] as Block | undefined;
    expect(block, `privacy.ai.${id} missing`).toBeDefined();
    for (const field of ["name", "role", "data", "purpose"] as const) {
      expect(block?.[field], `privacy.ai.${id}.${field}`).toBeTruthy();
    }
    expect(block?.name).toMatch(/USA|États-Unis/);
  });

  it("states the legal basis for the AI transfers", () => {
    expect(ai.basis).toBeTruthy();
  });
});
