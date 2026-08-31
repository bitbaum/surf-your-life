import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── The backfill cron must not report success it did not achieve ────────────
//
// The box runs this with `curl -fsS ... -o /dev/null`: the body is discarded,
// so the HTTP status is the whole signal, and `-f` + `set -e` turn a non-2xx
// into a failed systemd oneshot, which always pages. The old version counted
// attempts as writes and derived "fully caught up" from whether the batch came
// back full — so a 16-row backlog under a 50-row batch reported caught-up while
// embedding nothing, every night, forever.

const embedCheckIn = vi.fn();
const embedDocument = vi.fn();
const selectRows = vi.fn();
const countRows = vi.fn();

vi.mock("@/lib/auth/cron", () => ({ verifyCronAuth: () => null }));
vi.mock("@/lib/domain/embeddings", () => ({
  embedCheckIn: (...a: unknown[]) => embedCheckIn(...a),
  embedDocument: (...a: unknown[]) => embedDocument(...a),
}));

// db.select({id}).from(t).where(...).limit(n)  → pending ids
// db.select({n: count()}).from(t).where(...)   → awaited directly, remaining count
vi.mock("@/lib/db", () => ({
  db: {
    select: (shape: Record<string, unknown>) => ({
      from: (table: unknown) => {
        const where = () => {
          const rowsFor = "n" in shape ? countRows : selectRows;
          const result = rowsFor(table);
          return Object.assign(Promise.resolve(result), { limit: () => Promise.resolve(result) });
        };
        return { where };
      },
    }),
  },
}));

import { GET } from "@/app/api/cron/embed-backfill/route";

const req = new Request("http://localhost/api/cron/embed-backfill");

beforeEach(() => {
  vi.stubEnv("OPENAI_API_KEY", "sk-test");
  vi.stubEnv("NODE_ENV", "production");
  embedCheckIn.mockReset().mockResolvedValue(true);
  embedDocument.mockReset().mockResolvedValue(true);
  selectRows.mockReset().mockReturnValue([]);
  countRows.mockReset().mockReturnValue([{ n: 0 }]);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("GET /api/cron/embed-backfill", () => {
  it("fails closed with 503 in production when OPENAI_API_KEY is absent", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const res = await GET(req);
    // 503 → curl -f fails → oneshot fails → the founder is paged. A 200 here is
    // the exact silence that let production sit at zero embeddings.
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ success: false, error: "OPENAI_API_KEY is not set" });
  });

  it("stays a no-op outside production so local runs need no OpenAI account", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("NODE_ENV", "development");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it("counts writes, not attempts, when embedding fails", async () => {
    selectRows.mockReturnValue([{ id: "a" }, { id: "b" }, { id: "c" }]);
    embedCheckIn.mockResolvedValue(false);
    embedDocument.mockResolvedValue(false);
    countRows.mockReturnValue([{ n: 3 }]);

    const body = await (await GET(req)).json();

    expect(body.checkInsEmbedded).toBe(0);
    expect(body.checkInsFailed).toBe(3);
    expect(body.success).toBe(false);
  });

  it("reports the real remaining backlog rather than inferring it from batch size", async () => {
    // The original failure shape: a partial batch (3 < EMBED_BACKFILL_BATCH)
    // with every row still un-embedded afterwards.
    selectRows.mockReturnValue([{ id: "a" }, { id: "b" }, { id: "c" }]);
    embedCheckIn.mockResolvedValue(false);
    embedDocument.mockResolvedValue(false);
    countRows.mockReturnValue([{ n: 16 }]);

    const body = await (await GET(req)).json();

    expect(body.remainingCheckIns).toBe(16);
    expect(body.remainingDocuments).toBe(16);
    expect(JSON.stringify(body)).not.toContain("fully caught up");
  });

  it("reports success with a zero backlog once everything is embedded", async () => {
    selectRows.mockReturnValue([{ id: "a" }]);
    countRows.mockReturnValue([{ n: 0 }]);

    const body = await (await GET(req)).json();

    expect(body.success).toBe(true);
    expect(body.checkInsEmbedded).toBe(1);
    expect(body.remainingCheckIns).toBe(0);
    expect(body.checkInsFailed).toBeUndefined();
  });
});
