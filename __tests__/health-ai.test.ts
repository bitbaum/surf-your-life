import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── /api/health/ai proves the engine answers RIGHT NOW ──────────────────────
//
// `/api/health` reports what happened the last time the app happened to call a
// model, which straight after a deploy is "unknown" — and "unknown" is what it
// stays until real traffic arrives. This route is the one that can say "works",
// because it makes a call.
//
// ai-kit owns the probe's own guarantees (success cached, failure never cached,
// constant-time secret) and tests them there. What is app-specific, and what
// these tests hold, is the WIRING: that an ordinary poll is free, that the gate
// is really connected to AI_PROBE_SECRET, and — the one that would silently
// wreck this route — that the chain is built per request rather than at import.

const ORIGINAL_ENV = { ...process.env };

async function loadRoute() {
  vi.resetModules();
  const mod = await import("@/app/api/health/ai/route");
  return mod.GET;
}

function okResponse(text: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchSpy = vi.fn(async () => okResponse("blue"));
  vi.stubGlobal("fetch", fetchSpy);
  delete process.env.AI_PROBE_SECRET;
  delete process.env.SURF_GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.SURF_OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
});

afterEach(() => {
  vi.unstubAllGlobals();
  process.env = { ...ORIGINAL_ENV };
});

describe("GET /api/health/ai", () => {
  it("an ordinary poll reports passive health and spends nothing", async () => {
    const GET = await loadRoute();
    const res = await GET(new Request("https://surf.test/api/health/ai"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.probed).toBe(false);
    expect(body.health).toMatchObject({ status: expect.any(String) });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses to probe without the secret, and makes NO call while refusing", async () => {
    process.env.AI_PROBE_SECRET = "right";
    process.env.GROQ_API_KEY = "k";
    const GET = await loadRoute();

    const missing = await GET(new Request("https://surf.test/api/health/ai?probe=1"));
    expect(missing.status).toBe(401);

    const wrong = await GET(
      new Request("https://surf.test/api/health/ai?probe=1", {
        headers: { "x-probe-secret": "wrong" },
      }),
    );
    expect(wrong.status).toBe(401);

    // The point of the gate is the SPEND, not the status code. A 401 that had
    // already called the vendor would have cost the same tokens as a 200.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("with AI_PROBE_SECRET unset, probing is OFF (501) rather than open", async () => {
    process.env.GROQ_API_KEY = "k";
    const GET = await loadRoute();

    const res = await GET(new Request("https://surf.test/api/health/ai?probe=1&secret=anything"));

    expect(res.status).toBe(501);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("a good secret probes for real and returns the model's answer", async () => {
    process.env.AI_PROBE_SECRET = "right";
    process.env.GROQ_API_KEY = "k";
    const GET = await loadRoute();

    const res = await GET(
      new Request("https://surf.test/api/health/ai?probe=1", {
        headers: { "x-probe-secret": "right" },
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.probed).toBe(true);
    expect(body.answer).toBe("blue");
    expect(body.servedBy).toMatch(/\//);
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("a dead chain is 503, so an uptime monitor can watch this URL directly", async () => {
    process.env.AI_PROBE_SECRET = "right";
    process.env.GROQ_API_KEY = "k";
    fetchSpy.mockResolvedValue(new Response("upstream exploded", { status: 500 }));
    const GET = await loadRoute();

    const res = await GET(new Request("https://surf.test/api/health/ai?probe=1&secret=right"));

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.failures.length).toBeGreaterThan(0);
  });

  it("builds its chain PER REQUEST, so a build-time env with no keys cannot bake in a dead engine", async () => {
    // Import with no keys at all — this is what Next's build sees. If the chain
    // were built at module scope it would be frozen empty here, and the route
    // would report a dead engine forever on a deployment whose keys are fine.
    const GET = await loadRoute();

    process.env.AI_PROBE_SECRET = "right";
    process.env.GROQ_API_KEY = "k";

    const res = await GET(new Request("https://surf.test/api/health/ai?probe=1&secret=right"));

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("a probe teaches /api/health too — one call, both routes stop saying 'unknown'", async () => {
    process.env.AI_PROBE_SECRET = "right";
    process.env.GROQ_API_KEY = "k";
    vi.resetModules();
    const { GET } = await import("@/app/api/health/ai/route");
    const { getLLMHealth } = await import("@/lib/domain/llm");

    expect(getLLMHealth().status).toBe("unknown");

    await GET(new Request("https://surf.test/api/health/ai?probe=1&secret=right"));

    expect(getLLMHealth().status).toBe("ok");
  });
});
