import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// ─── Email delivery failures must leave a trace ──────────────────────────────
//
// The bug this file exists for: every batch sender (daily reminders, weekly
// reports, practitioner alert digests) sent mail with `.catch(() => {})` and
// then incremented `sent` unconditionally. A total Resend outage was therefore
// indistinguishable from a perfect run — the cron returned
// {"success":true,"sent":40}, logged nothing, and the box scheduler discards
// the response body anyway (`curl -o /dev/null`). sendEmailSafe is the one
// place that decides what a failed send does: log it, report it, never throw.

const { send } = vi.hoisted(() => ({ send: vi.fn() }))
vi.mock("resend", () => ({ Resend: class { emails = { send } } }))

import { sendEmail, sendEmailSafe, sendEmailFire } from "@/lib/email"

const opts = { to: "client@example.com", subject: "s", html: "<p>h</p>" }

beforeEach(() => {
  send.mockReset()
  send.mockResolvedValue({ id: "sent" })
  vi.stubEnv("RESEND_API_KEY", "re_test_key")
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe("sendEmailSafe reports the outcome", () => {
  it("returns true when the provider accepts the message", async () => {
    await expect(sendEmailSafe(opts, "tag")).resolves.toBe(true)
    expect(send).toHaveBeenCalledOnce()
  })

  it("returns false instead of throwing when the provider fails", async () => {
    send.mockRejectedValue(new Error("rate limited"))
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(sendEmailSafe(opts, "cron-reminders")).resolves.toBe(false)

    // The failure has to be visible: this console.error is the ONLY place a
    // delivery failure surfaces in production.
    expect(spy).toHaveBeenCalledOnce()
    const logged = spy.mock.calls[0].join(" ")
    expect(logged).toContain("cron-reminders")
    expect(logged).toContain("client@example.com")
  })

  it("does not abort a batch — one bad recipient leaves the rest sendable", async () => {
    send.mockRejectedValueOnce(new Error("bad address")).mockResolvedValue({ id: "ok" })
    vi.spyOn(console, "error").mockImplementation(() => {})

    const results = await Promise.all([
      sendEmailSafe({ ...opts, to: "bad@example.com" }, "t"),
      sendEmailSafe({ ...opts, to: "good@example.com" }, "t"),
    ])

    expect(results).toEqual([false, true])
  })
})

describe("a missing API key fails closed in production", () => {
  it("throws rather than silently dropping mail when RESEND_API_KEY is unset", async () => {
    vi.stubEnv("RESEND_API_KEY", "")
    vi.stubEnv("NODE_ENV", "production")

    await expect(sendEmail(opts)).rejects.toThrow(/RESEND_API_KEY/)
    expect(send).not.toHaveBeenCalled()
  })

  it("is counted as a failed delivery, not a success", async () => {
    vi.stubEnv("RESEND_API_KEY", "")
    vi.stubEnv("NODE_ENV", "production")
    vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(sendEmailSafe(opts, "cron-weekly-report")).resolves.toBe(false)
  })

  it("still previews to the console outside production, so local flows work", async () => {
    vi.stubEnv("RESEND_API_KEY", "")
    vi.stubEnv("NODE_ENV", "development")
    const spy = vi.spyOn(console, "log").mockImplementation(() => {})

    await expect(sendEmail(opts)).resolves.toBeUndefined()
    expect(spy).toHaveBeenCalledOnce()
  })
})

describe("sendEmailFire", () => {
  it("logs failures without propagating them to the caller", async () => {
    send.mockRejectedValue(new Error("boom"))
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => sendEmailFire(opts, "forgot-password")).not.toThrow()

    await vi.waitFor(() => expect(spy).toHaveBeenCalledOnce())
    expect(spy.mock.calls[0].join(" ")).toContain("forgot-password")
  })
})
