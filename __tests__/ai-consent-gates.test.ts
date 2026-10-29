import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── No client data reaches a model without that client's consent ────────────
//
// Every AI path is exercised against the REAL consent module
// (lib/domain/ai-consent) over an in-memory consent table. The model call
// (`callLLM`) and the OpenAI embedding request (`fetch`) are the two exits to a
// vendor; each test asserts whether they were reached. A path that forgets its
// consent check calls one of them in a "without consent" case and fails here.

const h = vi.hoisted(() => ({
  session: null as { user: { id: string; role: string; email: string } } | null,
  events: [] as Array<{ userId: string; action: string; createdAt: Date }>,
  callLLM: vi.fn<(...args: unknown[]) => Promise<string | null>>(),
  embeddingsCleared: [] as string[],
  inserted: [] as Array<Record<string, unknown>>,
  rows: {} as Record<string, unknown>,
}));

vi.mock("@/lib/auth", () => ({ auth: async () => h.session }));
vi.mock("@/lib/domain/llm", () => ({
  callLLM: (...a: unknown[]) => h.callLLM(...a),
}));

vi.mock("@/lib/db", async () => {
  const { getTableName } = await import("drizzle-orm");
  const { PgDialect } = await import("drizzle-orm/pg-core");
  const dialect = new PgDialect();
  const firstParam = (where: unknown) =>
    dialect.sqlToQuery(where as Parameters<typeof dialect.sqlToQuery>[0]).params[0];

  const table = (name: string) => ({
    findFirst: async (opts: { where?: unknown } = {}) => {
      if (name === "aiConsentEvents") {
        const userId = firstParam(opts.where);
        const mine = h.events.filter((e) => e.userId === userId);
        return mine.at(-1);
      }
      const r = h.rows[name];
      return Array.isArray(r) ? r[0] : r;
    },
    findMany: async () => {
      const r = h.rows[name];
      return Array.isArray(r) ? r : [];
    },
  });

  return {
    db: {
      query: new Proxy({}, { get: (_t, name: string) => table(name) }),
      insert: (t: object) => ({
        values: (v: Record<string, unknown>) => {
          const name = getTableName(t as never);
          const row = { ...v, createdAt: new Date(Date.now() + h.events.length) };
          if (name === "ai_consent_events") h.events.push(row as never);
          else h.inserted.push({ table: name, ...v });
          return { returning: async () => [row] };
        },
      }),
      update: (t: object) => ({
        set: (values: Record<string, unknown>) => ({
          where: async () => {
            if ("embedding" in values && values.embedding === null) {
              h.embeddingsCleared.push(getTableName(t as never));
            }
          },
        }),
      }),
      // semanticCheckInSearch's vector query — never reached in a test that
      // matters, and its failure is caught (falls back to recency).
      select: () => {
        throw new Error("select not faked");
      },
    },
  };
});

import { generateAiReply } from "@/lib/domain/ai-chat";
import { generateClientDigest } from "@/lib/domain/digest";
import { embedCheckIn, embedDocument, semanticCheckInSearch } from "@/lib/domain/embeddings";
import { POST as formAssist } from "@/app/api/ai/form-assist/route";
import { POST as sessionPrep } from "@/app/api/admin/clients/[id]/session-prep/route";
import { POST as decide } from "@/app/api/settings/ai-consent/route";

const CLIENT = "11111111-1111-4111-8111-111111111111";
const CHECK_IN = {
  userId: CLIENT,
  createdAt: new Date(),
  mood: "low",
  energyLevel: 3,
  sleepHours: 6,
  sleepQuality: 2,
  activityLevel: "rest",
  pemFlag: false,
  pemSeverity: null,
  orthostaticSymptoms: false,
  symptomFatigue: 7,
  symptomBrainFog: 5,
  symptomPain: 2,
  stressLevel: 6,
  journalEntry: "rough day",
  wins: null,
  challenges: null,
  notes: null,
};

const fetchSpy = vi.fn();
let staffSeq = 0;

function grant(userId = CLIENT) {
  h.events.push({ userId, action: "granted", createdAt: new Date() });
}

function asClient() {
  h.session = { user: { id: CLIENT, role: "client", email: "c@example.com" } };
}

function asStaff() {
  // A fresh staff id per call keeps the per-person rate limiter out of the way.
  h.session = { user: { id: `staff-${++staffSeq}`, role: "practitioner", email: "p@example.com" } };
}

function decision(action: string) {
  return decide(
    new Request("http://localhost/api/settings/ai-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }),
  );
}

function assist() {
  return formAssist(
    new Request("http://localhost/api/ai/form-assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: "check-in", intent: "fill", instruction: "slept badly" }),
    }),
  );
}

function prep() {
  return sessionPrep(new Request("http://localhost", { method: "POST" }), {
    params: Promise.resolve({ id: CLIENT }),
  });
}

beforeEach(() => {
  h.events = [];
  h.inserted = [];
  h.embeddingsCleared = [];
  h.session = null;
  h.rows = {
    checkIns: [CHECK_IN, CHECK_IN, CHECK_IN],
    users: { id: CLIENT, name: "Client", email: "c@example.com", profile: null },
    documents: { userId: CLIENT, title: "Lab report", content: "ferritin 12", type: "lab" },
  };
  h.callLLM.mockReset().mockResolvedValue("AI text");
  fetchSpy.mockReset().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => ({ data: [{ embedding: new Array(1536).fill(0.1) }] }),
  });
  vi.stubGlobal("fetch", fetchSpy);
  vi.stubEnv("OPENAI_API_KEY", "sk-test");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("client AI assistant", () => {
  it("without consent: rule-based reply, no model call, no query embedding", async () => {
    const reply = await generateAiReply(CLIENT, "How is my energy?", []);
    expect(reply).toBeTruthy();
    expect(reply).not.toBe("AI text");
    expect(h.callLLM).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("with consent: calls the model", async () => {
    grant();
    await expect(generateAiReply(CLIENT, "How is my energy?", [])).resolves.toBe("AI text");
    expect(h.callLLM).toHaveBeenCalledOnce();
  });

  it("'Not now' is not consent", async () => {
    h.events.push({ userId: CLIENT, action: "declined", createdAt: new Date() });
    await generateAiReply(CLIENT, "How is my energy?", []);
    expect(h.callLLM).not.toHaveBeenCalled();
  });
});

describe("check-in AI help (/api/ai/form-assist)", () => {
  it("without consent: fills from keywords and never calls the model", async () => {
    asClient();
    const res = await assist();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.message).toMatch(/AI is off/);
    expect(h.callLLM).not.toHaveBeenCalled();
  });

  it("with consent: calls the model", async () => {
    asClient();
    grant();
    h.callLLM.mockResolvedValue(JSON.stringify({ values: { mood: "low" }, message: "ok" }));
    const res = await assist();
    expect(res.status).toBe(200);
    expect(h.callLLM).toHaveBeenCalledOnce();
  });
});

describe("practitioner session prep — the CLIENT's consent governs", () => {
  it("without the client's consent: rule-based summary, no model call", async () => {
    asStaff();
    // The practitioner's own consent is irrelevant: it is not their data.
    grant(h.session!.user.id);
    const res = await prep();
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.aiGenerated).toBe(false);
    expect(h.callLLM).not.toHaveBeenCalled();
  });

  it("with the client's consent: calls the model", async () => {
    asStaff();
    grant();
    const res = await prep();
    const { data } = await res.json();
    expect(data.aiGenerated).toBe(true);
    expect(h.callLLM).toHaveBeenCalledOnce();
  });
});

describe("weekly digest — the CLIENT's consent governs", () => {
  it("without consent: reports no_consent and never calls the model", async () => {
    await expect(generateClientDigest(CLIENT, "Client")).resolves.toEqual({
      status: "no_consent",
    });
    expect(h.callLLM).not.toHaveBeenCalled();
  });

  it("with consent: writes the digest", async () => {
    grant();
    const result = await generateClientDigest(CLIENT, "Client");
    expect(result.status).toBe("generated");
    expect(h.callLLM).toHaveBeenCalledOnce();
  });
});

describe("semantic search (OpenAI embeddings)", () => {
  it("without consent: check-ins, documents and queries are never sent", async () => {
    await expect(embedCheckIn("ci-1")).resolves.toBe(false);
    await expect(embedDocument("doc-1")).resolves.toBe(false);
    await expect(semanticCheckInSearch(CLIENT, "energy")).resolves.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("with consent: check-ins, documents and queries are embedded", async () => {
    grant();
    await expect(embedCheckIn("ci-1")).resolves.toBe(true);
    await expect(embedDocument("doc-1")).resolves.toBe(true);
    await semanticCheckInSearch(CLIENT, "energy");
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});

describe("consent decisions (/api/settings/ai-consent)", () => {
  it("refuses an anonymous request", async () => {
    const res = await decision("granted");
    expect(res.status).toBe(401);
    expect(h.events).toHaveLength(0);
  });

  it("refuses an unknown action", async () => {
    asClient();
    const res = await decision("maybe");
    expect(res.status).toBe(400);
    expect(h.events).toHaveLength(0);
  });

  it("records each decision for the signed-in user with a timestamp and version", async () => {
    asClient();
    await decision("granted");
    await decision("withdrawn");
    expect(h.events.map((e) => e.action)).toEqual(["granted", "withdrawn"]);
    for (const e of h.events) {
      expect(e.userId).toBe(CLIENT);
      expect(e.createdAt).toBeInstanceOf(Date);
      expect((e as unknown as { policyVersion: string }).policyVersion).toBeTruthy();
    }
  });

  it("withdrawal takes effect on the very next request, on every path", async () => {
    asClient();
    await decision("granted");
    await generateAiReply(CLIENT, "How is my energy?", []);
    expect(h.callLLM).toHaveBeenCalledOnce();

    const res = await decision("withdrawn");
    expect(res.status).toBe(200);
    // The search index built from this client's data is deleted at once.
    expect(h.embeddingsCleared.sort()).toEqual(["check_ins", "documents"]);

    h.callLLM.mockClear();
    fetchSpy.mockClear();
    await generateAiReply(CLIENT, "How is my energy?", []);
    await assist();
    asStaff();
    await prep();
    await generateClientDigest(CLIENT, "Client");
    await embedCheckIn("ci-1");
    await embedDocument("doc-1");
    expect(h.callLLM).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
