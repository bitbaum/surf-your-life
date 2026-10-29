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

// Section 3 describes the consent step, and the consent screen names the same
// vendors: a vendor added to AI_PROCESSORS without both fails here.
describe.each(routing.locales)("AI consent step (%s)", (locale) => {
  const messages = JSON.parse(
    readFileSync(resolve(process.cwd(), "messages", `${locale}.json`), "utf8"),
  ) as {
    privacy: { purpose: { aiConsent?: string } };
    portal: { aiConsent: { who: string } };
  };
  const vendors = [...AI_PROCESSORS.map((id) => (id === "groq" ? "Groq" : "OpenRouter")), "OpenAI"];

  it("section 3 describes the consent step and names every AI vendor", () => {
    const text = messages.privacy.purpose.aiConsent ?? "";
    for (const vendor of vendors) expect(text).toContain(vendor);
  });

  it("the consent screen names every AI vendor and the USA", () => {
    const who = messages.portal.aiConsent.who;
    for (const vendor of vendors) expect(who).toContain(vendor);
    expect(who).toMatch(/USA|États-Unis/);
  });
});
