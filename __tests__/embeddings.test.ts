import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── The embedding pipeline must report what it achieved ─────────────────────
//
// The bug this file exists for: embedCheckIn/embedDocument returned void and
// swallowed every failure ("Never surface embedding failures to callers"), so
// the nightly backfill's per-item try/catch was dead code and it counted
// ATTEMPTS as writes. Production ran for weeks with 16 check-ins and 2 profiles
// at zero embeddings while the cron answered HTTP 200 and reported "fully
// caught up" — and the box scheduler discards the body (`curl -o /dev/null`),
// so the status code and these console.errors are the only signals that exist.

const dbUpdate = vi.fn();
const findFirstCheckIn = vi.fn();
const findFirstDocument = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      checkIns: { findFirst: (...a: unknown[]) => findFirstCheckIn(...a) },
      documents: { findFirst: (...a: unknown[]) => findFirstDocument(...a) },
    },
    update: () => ({ set: () => ({ where: (...a: unknown[]) => dbUpdate(...a) }) }),
  },
}));

import { embedCheckIn, embedDocument } from "@/lib/domain/embeddings";

const CHECK_IN = {
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

function okResponse(embedding = new Array(1536).fill(0.1)) {
  return { ok: true, status: 200, statusText: "OK", json: async () => ({ data: [{ embedding }] }) };
}

let errSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  dbUpdate.mockReset().mockResolvedValue(undefined);
  findFirstCheckIn.mockReset().mockResolvedValue(CHECK_IN);
  findFirstDocument
    .mockReset()
    .mockResolvedValue({ title: "Lab report", content: "ferritin 12", type: "lab" });
  vi.stubEnv("OPENAI_API_KEY", "sk-test");
  errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("embedCheckIn reports whether a row was written", () => {
  it("returns true and writes when OpenAI returns an embedding", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse()));
    await expect(embedCheckIn("ci-1")).resolves.toBe(true);
    expect(dbUpdate).toHaveBeenCalledOnce();
  });

  it("returns false WITHOUT writing when OpenAI rejects the request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "invalid_api_key",
      }),
    );

    await expect(embedCheckIn("ci-1")).resolves.toBe(false);
    expect(dbUpdate).not.toHaveBeenCalled();
    // The status is the diagnosis and must reach the journal — it is the only
    // place a revoked key can surface in production.
    expect(errSpy).toHaveBeenCalled();
    expect(String(errSpy.mock.calls[0][0])).toContain("401");
  });

  it("returns false instead of throwing when the request itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));
    await expect(embedCheckIn("ci-1")).resolves.toBe(false);
    expect(errSpy).toHaveBeenCalled();
  });

  it("returns false and logs when the check-in does not exist", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse()));
    findFirstCheckIn.mockResolvedValue(undefined);
    await expect(embedCheckIn("missing")).resolves.toBe(false);
    expect(errSpy).toHaveBeenCalled();
  });

  it("returns false when no API key is configured, and never claims a write", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("OPENAI_API_KEY", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(embedCheckIn("ci-1")).resolves.toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(dbUpdate).not.toHaveBeenCalled();
  });

  it("never throws — request-path callers use `void embedCheckIn(id)`", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    findFirstCheckIn.mockRejectedValue(new Error("db down"));
    await expect(embedCheckIn("ci-1")).resolves.toBe(false);
  });
});

describe("embedDocument reports whether a row was written", () => {
  it("returns true and writes on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse()));
    await expect(embedDocument("doc-1")).resolves.toBe(true);
    expect(dbUpdate).toHaveBeenCalledOnce();
  });

  it("returns false without writing when the document has no content", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse()));
    findFirstDocument.mockResolvedValue({ title: "Scan", content: null, type: "lab" });
    await expect(embedDocument("doc-1")).resolves.toBe(false);
    expect(dbUpdate).not.toHaveBeenCalled();
  });

  it("returns false when OpenAI answers 200 with no embedding in the payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ data: [] }),
      }),
    );
    await expect(embedDocument("doc-1")).resolves.toBe(false);
    expect(dbUpdate).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalled();
  });
});
