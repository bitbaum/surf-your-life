import { describe, expect, it } from "vitest";
import { AI_PROCESSORS, disclosedChain } from "@/lib/domain/llm";

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

// The privacy policy names Groq and OpenRouter as the AI processors that
// receive health data. A key for any other vendor ai-kit knows must not widen
// that list behind the policy's back.
describe("disclosedChain", () => {
  it("uses only the vendors the privacy policy names, whatever keys are present", () => {
    const chain = disclosedChain(
      env({ GROQ_API_KEY: "g", OPENROUTER_API_KEY: "o", GEMINI_API_KEY: "x" }),
    );
    const vendors = new Set(chain.map((link) => link.provider.id));
    expect([...vendors].sort()).toEqual([...AI_PROCESSORS].sort());
  });

  it("is empty when only an undisclosed vendor has a key", () => {
    expect(disclosedChain(env({ GEMINI_API_KEY: "x" }))).toEqual([]);
  });

  it("tries Groq before OpenRouter, as the policy says", () => {
    const chain = disclosedChain(env({ GROQ_API_KEY: "g", OPENROUTER_API_KEY: "o" }));
    expect(chain[0].provider.id).toBe("groq");
    expect(chain[chain.length - 1].provider.id).toBe("openrouter");
  });
});
