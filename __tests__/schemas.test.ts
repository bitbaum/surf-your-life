/**
 * Schema validation tests for domain modules that contain only Zod schemas
 * and no DB dependencies: booking, lead, services, messaging.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
import { createBookingSchema } from "@/lib/domain/booking";
import { contactSchema, newsletterSchema } from "@/lib/domain/lead";
import { serviceSchema, serviceUpdateSchema } from "@/lib/domain/services";
import { createThreadSchema, sendMessageSchema } from "@/lib/domain/messaging";
import {
  FIELD_MAX_TITLE,
  FIELD_MAX_SHORT,
  FIELD_MAX_MEDIUM,
  FIELD_MAX_MESSAGE,
  SERVICE_DURATION_MINUTES,
  BOOKING_TIME_PREFERENCE_VALUES,
} from "@/lib/constants";
import { SERVICE_CATEGORIES } from "@/lib/domain/services";

// ─── createBookingSchema ──────────────────────────────────────────────────────

describe("createBookingSchema", () => {
  const valid = {
    serviceId: "550e8400-e29b-41d4-a716-446655440000",
    preferredDate: "2024-07-15",
    preferredTime: "morning" as const,
    notes: "Please confirm via email.",
  };

  it("accepts a fully valid booking", () => {
    expect(createBookingSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts booking without optional notes", () => {
    const { notes: _, ...noNotes } = valid;
    expect(createBookingSchema.safeParse(noNotes).success).toBe(true);
  });

  it("accepts all valid time preference values", () => {
    for (const time of BOOKING_TIME_PREFERENCE_VALUES) {
      expect(createBookingSchema.safeParse({ ...valid, preferredTime: time }).success).toBe(true);
    }
  });

  it("rejects invalid time preference", () => {
    expect(createBookingSchema.safeParse({ ...valid, preferredTime: "evening" }).success).toBe(
      false,
    );
  });

  it("rejects non-UUID serviceId", () => {
    expect(createBookingSchema.safeParse({ ...valid, serviceId: "not-a-uuid" }).success).toBe(
      false,
    );
  });

  it("rejects malformed preferredDate (not YYYY-MM-DD)", () => {
    expect(createBookingSchema.safeParse({ ...valid, preferredDate: "07/15/2024" }).success).toBe(
      false,
    );
    expect(createBookingSchema.safeParse({ ...valid, preferredDate: "2024-7-15" }).success).toBe(
      false,
    );
    expect(createBookingSchema.safeParse({ ...valid, preferredDate: "20240715" }).success).toBe(
      false,
    );
  });

  it(`accepts notes up to ${FIELD_MAX_MEDIUM} characters`, () => {
    expect(
      createBookingSchema.safeParse({ ...valid, notes: "x".repeat(FIELD_MAX_MEDIUM) }).success,
    ).toBe(true);
  });

  it(`rejects notes exceeding ${FIELD_MAX_MEDIUM} characters`, () => {
    expect(
      createBookingSchema.safeParse({ ...valid, notes: "x".repeat(FIELD_MAX_MEDIUM + 1) }).success,
    ).toBe(false);
  });

  it("rejects missing required fields", () => {
    expect(createBookingSchema.safeParse({}).success).toBe(false);
    expect(createBookingSchema.safeParse({ serviceId: valid.serviceId }).success).toBe(false);
  });
});

// ─── contactSchema ────────────────────────────────────────────────────────────

describe("contactSchema", () => {
  const valid = {
    name: "Anna Schmidt",
    email: "anna@example.com",
    message: "I'd like to learn more about your programs.",
  };

  it("accepts valid contact form input", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts input without optional message", () => {
    const { message: _, ...noMessage } = valid;
    expect(contactSchema.safeParse(noMessage).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(contactSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it(`rejects name exceeding ${FIELD_MAX_TITLE} characters`, () => {
    expect(
      contactSchema.safeParse({ ...valid, name: "x".repeat(FIELD_MAX_TITLE + 1) }).success,
    ).toBe(false);
  });

  it(`accepts name exactly ${FIELD_MAX_TITLE} characters`, () => {
    expect(contactSchema.safeParse({ ...valid, name: "x".repeat(FIELD_MAX_TITLE) }).success).toBe(
      true,
    );
  });

  it("rejects invalid email", () => {
    expect(contactSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects email exceeding 300 characters", () => {
    const long = "x".repeat(291) + "@example.com";
    expect(contactSchema.safeParse({ ...valid, email: long }).success).toBe(false);
  });

  it(`rejects message exceeding ${FIELD_MAX_MESSAGE} characters`, () => {
    expect(
      contactSchema.safeParse({ ...valid, message: "x".repeat(FIELD_MAX_MESSAGE + 1) }).success,
    ).toBe(false);
  });

  it(`accepts message exactly ${FIELD_MAX_MESSAGE} characters`, () => {
    expect(
      contactSchema.safeParse({ ...valid, message: "x".repeat(FIELD_MAX_MESSAGE) }).success,
    ).toBe(true);
  });
});

// ─── newsletterSchema ─────────────────────────────────────────────────────────

describe("newsletterSchema", () => {
  it("accepts valid email only", () => {
    expect(newsletterSchema.safeParse({ email: "subscriber@example.com" }).success).toBe(true);
  });

  it("uses 'newsletter' as default source when omitted", () => {
    const result = newsletterSchema.safeParse({ email: "sub@example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe("newsletter");
    }
  });

  it("accepts explicit source", () => {
    const result = newsletterSchema.safeParse({ email: "sub@example.com", source: "homepage" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe("homepage");
    }
  });

  it("rejects invalid email", () => {
    expect(newsletterSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });

  it(`rejects source exceeding ${FIELD_MAX_SHORT} characters`, () => {
    expect(
      newsletterSchema.safeParse({
        email: "sub@example.com",
        source: "x".repeat(FIELD_MAX_SHORT + 1),
      }).success,
    ).toBe(false);
  });

  it("rejects missing email", () => {
    expect(newsletterSchema.safeParse({}).success).toBe(false);
  });
});

// ─── serviceSchema ────────────────────────────────────────────────────────────

describe("serviceSchema", () => {
  const valid = {
    name: "Hyperbaric Oxygen Therapy",
    description: "Pressurized oxygen session",
    category: "machine" as const,
    durationMinutes: 60,
  };

  it("accepts a fully valid service", () => {
    expect(serviceSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts service without optional fields", () => {
    expect(serviceSchema.safeParse({ name: "HBOT", category: "machine" }).success).toBe(true);
  });

  it("accepts all valid category values", () => {
    for (const cat of SERVICE_CATEGORIES) {
      expect(serviceSchema.safeParse({ ...valid, category: cat }).success).toBe(true);
    }
  });

  it("rejects invalid category", () => {
    expect(serviceSchema.safeParse({ ...valid, category: "therapy" }).success).toBe(false);
  });

  it("rejects empty name", () => {
    expect(serviceSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it(`rejects name exceeding ${FIELD_MAX_SHORT} characters`, () => {
    expect(
      serviceSchema.safeParse({ ...valid, name: "x".repeat(FIELD_MAX_SHORT + 1) }).success,
    ).toBe(false);
  });

  it(`rejects durationMinutes below ${SERVICE_DURATION_MINUTES.min}`, () => {
    expect(
      serviceSchema.safeParse({ ...valid, durationMinutes: SERVICE_DURATION_MINUTES.min - 1 })
        .success,
    ).toBe(false);
  });

  it(`rejects durationMinutes above ${SERVICE_DURATION_MINUTES.max}`, () => {
    expect(
      serviceSchema.safeParse({ ...valid, durationMinutes: SERVICE_DURATION_MINUTES.max + 1 })
        .success,
    ).toBe(false);
  });

  it(`accepts boundary values for durationMinutes (${SERVICE_DURATION_MINUTES.min} and ${SERVICE_DURATION_MINUTES.max})`, () => {
    expect(
      serviceSchema.safeParse({ ...valid, durationMinutes: SERVICE_DURATION_MINUTES.min }).success,
    ).toBe(true);
    expect(
      serviceSchema.safeParse({ ...valid, durationMinutes: SERVICE_DURATION_MINUTES.max }).success,
    ).toBe(true);
  });

  it("rejects non-integer durationMinutes", () => {
    expect(serviceSchema.safeParse({ ...valid, durationMinutes: 60.5 }).success).toBe(false);
  });

  it("accepts null durationMinutes", () => {
    expect(serviceSchema.safeParse({ ...valid, durationMinutes: null }).success).toBe(true);
  });
});

// ─── serviceUpdateSchema ──────────────────────────────────────────────────────

describe("serviceUpdateSchema", () => {
  it("accepts partial updates (only name)", () => {
    expect(serviceUpdateSchema.safeParse({ name: "Updated Name" }).success).toBe(true);
  });

  it("accepts available flag", () => {
    expect(serviceUpdateSchema.safeParse({ available: false }).success).toBe(true);
  });

  it("accepts sortOrder", () => {
    expect(serviceUpdateSchema.safeParse({ sortOrder: 3 }).success).toBe(true);
  });

  it("rejects negative sortOrder", () => {
    expect(serviceUpdateSchema.safeParse({ sortOrder: -1 }).success).toBe(false);
  });

  it("accepts empty object (all fields optional in partial)", () => {
    expect(serviceUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("rejects invalid category in update", () => {
    expect(serviceUpdateSchema.safeParse({ category: "unknown" }).success).toBe(false);
  });
});

// ─── createThreadSchema ───────────────────────────────────────────────────────

describe("createThreadSchema", () => {
  const valid = {
    subject: "Follow-up after last session",
    body: "Hi, I wanted to ask about the pacing protocol we discussed.",
    clientId: "550e8400-e29b-41d4-a716-446655440000",
  };

  it("accepts valid thread creation", () => {
    expect(createThreadSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts thread without optional clientId", () => {
    const { clientId: _, ...noClient } = valid;
    expect(createThreadSchema.safeParse(noClient).success).toBe(true);
  });

  it("rejects empty subject", () => {
    expect(createThreadSchema.safeParse({ ...valid, subject: "" }).success).toBe(false);
  });

  it(`rejects subject exceeding ${FIELD_MAX_TITLE} characters`, () => {
    expect(
      createThreadSchema.safeParse({ ...valid, subject: "x".repeat(FIELD_MAX_TITLE + 1) }).success,
    ).toBe(false);
  });

  it("rejects empty body", () => {
    expect(createThreadSchema.safeParse({ ...valid, body: "" }).success).toBe(false);
  });

  it(`rejects body exceeding ${FIELD_MAX_MESSAGE} characters`, () => {
    expect(
      createThreadSchema.safeParse({ ...valid, body: "x".repeat(FIELD_MAX_MESSAGE + 1) }).success,
    ).toBe(false);
  });

  it("rejects non-UUID clientId", () => {
    expect(createThreadSchema.safeParse({ ...valid, clientId: "not-a-uuid" }).success).toBe(false);
  });
});

// ─── sendMessageSchema ────────────────────────────────────────────────────────

describe("sendMessageSchema", () => {
  it("accepts valid message body", () => {
    expect(sendMessageSchema.safeParse({ body: "Thank you for the update." }).success).toBe(true);
  });

  it("rejects empty body", () => {
    expect(sendMessageSchema.safeParse({ body: "" }).success).toBe(false);
  });

  it(`rejects body exceeding ${FIELD_MAX_MESSAGE} characters`, () => {
    expect(sendMessageSchema.safeParse({ body: "x".repeat(FIELD_MAX_MESSAGE + 1) }).success).toBe(
      false,
    );
  });

  it(`accepts body exactly ${FIELD_MAX_MESSAGE} characters`, () => {
    expect(sendMessageSchema.safeParse({ body: "x".repeat(FIELD_MAX_MESSAGE) }).success).toBe(true);
  });

  it("rejects missing body", () => {
    expect(sendMessageSchema.safeParse({}).success).toBe(false);
  });
});
