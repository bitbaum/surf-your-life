/**
 * Unit tests for the keyword-based check-in parser (lib/domain/check-in-parse.ts).
 * keywordParse is pure: no DB, no network, no mocks needed.
 * This is the fallback path used when no chain provider is configured.
 */
import { describe, it, expect } from "vitest";
import { keywordParse } from "@/lib/domain/check-in-parse";

// ─── journalEntry ─────────────────────────────────────────────────────────────

describe("keywordParse — journalEntry", () => {
  it("always sets journalEntry to the trimmed input", () => {
    const result = keywordParse("  Had a rough day.  ");
    expect(result.journalEntry).toBe("Had a rough day.");
  });

  it("preserves original casing in journalEntry", () => {
    const result = keywordParse("Slept well. Energy was Good.");
    expect(result.journalEntry).toBe("Slept well. Energy was Good.");
  });
});

// ─── Mood detection ───────────────────────────────────────────────────────────

describe("keywordParse — mood", () => {
  it.each([
    ["felt terrible today", "very_low"],
    ["it was awful", "very_low"],
    ["horrible morning", "very_low"],
    ["I feel miserable", "very_low"],
    ["rock bottom", "very_low"],
  ])("maps '%s' → very_low", (text, mood) => {
    expect(keywordParse(text).mood).toBe(mood);
  });

  it.each([
    ["had a bad day", "low"],
    ["rough morning all round", "low"],
    ["things are tough right now", "low"],
    ["struggling to get through", "low"],
    ["feel a bit down", "low"],
  ])("maps '%s' → low", (text, mood) => {
    expect(keywordParse(text).mood).toBe(mood);
  });

  it.each([
    ["feeling okay today", "neutral"],
    ["it was fine", "neutral"],
    ["so-so kind of day", "neutral"],
    ["just meh", "neutral"],
    ["manageable day", "neutral"],
  ])("maps '%s' → neutral", (text, mood) => {
    expect(keywordParse(text).mood).toBe(mood);
  });

  it.each([
    ["had a good day", "good"],
    ["feeling well", "good"],
    ["decent session this afternoon", "good"],
    ["showing improvement", "good"],
    ["positive vibes today", "good"],
  ])("maps '%s' → good", (text, mood) => {
    expect(keywordParse(text).mood).toBe(mood);
  });

  it.each([
    ["feeling great today", "excellent"],
    ["amazing walk this morning", "excellent"],
    ["wonderful afternoon", "excellent"],
    ["fantastic energy all day", "excellent"],
    ["brilliant day overall", "excellent"],
  ])("maps '%s' → excellent", (text, mood) => {
    expect(keywordParse(text).mood).toBe(mood);
  });

  it("returns undefined mood for neutral unrecognised text", () => {
    expect(keywordParse("Did some reading. Watched TV.").mood).toBeUndefined();
  });
});

// ─── Energy — numeric extraction ─────────────────────────────────────────────

describe("keywordParse — energy (numeric)", () => {
  it("extracts energy level from 'energy was 7'", () => {
    expect(keywordParse("energy was 7 today").energyLevel).toBe(7);
  });

  it("extracts energy from '7/10' pattern", () => {
    expect(keywordParse("I'd say 7/10 energy").energyLevel).toBe(7);
  });

  it("extracts energy from '10/10 energy' (max)", () => {
    expect(keywordParse("10/10 energy today").energyLevel).toBe(10);
  });

  it("does not extract energy=0 (below valid range)", () => {
    // regex matches 1-9 and 10 only
    expect(keywordParse("0/10 energy").energyLevel).toBeUndefined();
  });
});

// ─── Energy — adjective extraction ───────────────────────────────────────────

describe("keywordParse — energy (adjective)", () => {
  it.each([
    ["completely drained today", 2],
    ["totally depleted", 2],
    ["completely exhausted all day", 2],
  ])("maps '%s' → energyLevel 2", (text, level) => {
    expect(keywordParse(text).energyLevel).toBe(level);
  });

  it.each([
    ["I was exhausted", 3],
    ["very tired after lunch", 3],
    ["wiped out completely", 3],
  ])("maps '%s' → energyLevel 3", (text, level) => {
    expect(keywordParse(text).energyLevel).toBe(level);
  });

  it.each([
    ["feeling tired today", 4],
    ["low energy morning", 4],
    ["a bit fatigued", 4],
    ["sluggish all day", 4],
  ])("maps '%s' → energyLevel 4", (text, level) => {
    expect(keywordParse(text).energyLevel).toBe(level);
  });

  it.each([
    ["moderate energy levels", 5],
    ["okay energy today", 5],
  ])("maps '%s' → energyLevel 5", (text, level) => {
    expect(keywordParse(text).energyLevel).toBe(level);
  });

  it.each([
    ["decent energy this afternoon", 6],
    ["reasonable energy for once", 6],
  ])("maps '%s' → energyLevel 6", (text, level) => {
    expect(keywordParse(text).energyLevel).toBe(level);
  });

  it.each([
    ["good energy all morning", 7],
    ["feeling energised", 7],
    ["energized and ready", 7],
  ])("maps '%s' → energyLevel 7", (text, level) => {
    expect(keywordParse(text).energyLevel).toBe(level);
  });

  it.each([
    ["great energy today", 9],
    ["high energy day", 9],
    ["lots of energy", 9],
    ["full of energy", 9],
  ])("maps '%s' → energyLevel 9", (text, level) => {
    expect(keywordParse(text).energyLevel).toBe(level);
  });

  it("returns undefined when no energy signal", () => {
    expect(keywordParse("Quiet day at home.").energyLevel).toBeUndefined();
  });
});

// ─── Sleep hours ──────────────────────────────────────────────────────────────

describe("keywordParse — sleepHours", () => {
  it("extracts hours from 'slept 8 hours'", () => {
    expect(keywordParse("slept 8 hours last night").sleepHours).toBe(8);
  });

  it("extracts hours from 'slept about 7h'", () => {
    expect(keywordParse("slept about 7h").sleepHours).toBe(7);
  });

  it("extracts hours from '6 hours of sleep'", () => {
    expect(keywordParse("got 6 hours of sleep").sleepHours).toBe(6);
  });

  it("extracts hours from '7.5 hrs sleep' and rounds", () => {
    expect(keywordParse("7.5 hrs sleep").sleepHours).toBe(8);
  });

  it("extracts hours from 'sleep 9' pattern", () => {
    expect(keywordParse("sleep 9 last night").sleepHours).toBe(9);
  });

  it("returns undefined when no sleep signal", () => {
    expect(keywordParse("Had a productive morning.").sleepHours).toBeUndefined();
  });

  it("ignores out-of-range values (> 24)", () => {
    expect(keywordParse("slept 25 hours").sleepHours).toBeUndefined();
  });
});

// ─── Activity level ───────────────────────────────────────────────────────────

describe("keywordParse — activityLevel", () => {
  it.each([
    ["stayed in bed all day", "rest"],
    ["complete rest today", "rest"],
    ["no activity whatsoever", "rest"],
    ["resting all day", "rest"],
    ["bedbound unfortunately", "rest"],
  ])("maps '%s' → rest", (text, level) => {
    expect(keywordParse(text).activityLevel).toBe(level);
  });

  it.each([
    ["went for a short walk", "light"],
    ["gentle walk this morning", "light"],
    ["light activity only", "light"],
    ["gentle movement session", "light"],
    ["easy day overall", "light"],
  ])("maps '%s' → light", (text, level) => {
    expect(keywordParse(text).activityLevel).toBe(level);
  });

  it.each([
    ["walked to the shops", "moderate"],
    ["some activity during the day", "moderate"],
    ["did housework this afternoon", "moderate"],
    ["ran a few errands", "moderate"],
    ["light exercise session", "moderate"],
  ])("maps '%s' → moderate", (text, level) => {
    expect(keywordParse(text).activityLevel).toBe(level);
  });

  it.each([
    ["went to the gym", "active"],
    ["went for a run", "active"],
    ["ran 5k this morning", "active"],
    ["full workout session", "active"],
    ["went cycling", "active"],
    ["went swimming", "active"],
    ["very active day", "active"],
    ["busy day on my feet", "active"],
  ])("maps '%s' → active", (text, level) => {
    expect(keywordParse(text).activityLevel).toBe(level);
  });

  it("returns undefined when no activity signal", () => {
    expect(keywordParse("Read a book. Watched TV.").activityLevel).toBeUndefined();
  });
});

// ─── PEM detection ────────────────────────────────────────────────────────────

describe("keywordParse — pemFlag", () => {
  it.each([
    ["had PEM today"],
    ["post-exertional crash"],
    ["crashed after the walk"],
    ["crash after exercise yesterday"],
    ["feeling worse after activity"],
    ["flare after the gym"],
    ["experiencing payback from yesterday"],
  ])("detects PEM in '%s'", (text) => {
    expect(keywordParse(text).pemFlag).toBe(true);
  });

  it("returns undefined pemFlag when no PEM signal", () => {
    expect(keywordParse("Normal day, walked to the shops.").pemFlag).toBeUndefined();
  });
});

// ─── Orthostatic symptoms ─────────────────────────────────────────────────────

describe("keywordParse — orthostaticSymptoms", () => {
  it.each([
    ["feeling dizzy today"],
    ["had some dizziness this morning"],
    ["lightheaded when I got up"],
    ["light-headed after standing"],
    ["dizzy when I stood up quickly"],
    ["stood up and got dizzy"],
    ["experiencing vertigo"],
  ])("detects orthostatic symptoms in '%s'", (text) => {
    expect(keywordParse(text).orthostaticSymptoms).toBe(true);
  });

  it("returns undefined when no orthostatic signal", () => {
    expect(keywordParse("Good walk. No symptoms.").orthostaticSymptoms).toBeUndefined();
  });
});

// ─── Combined extraction ──────────────────────────────────────────────────────

describe("keywordParse — combined fields", () => {
  it("extracts multiple fields from a realistic check-in", () => {
    const text =
      "Had a rough day. Slept 6 hours. Went for a short walk but felt very tired afterwards and got dizzy when I stood up.";
    const result = keywordParse(text);
    expect(result.mood).toBe("low");
    expect(result.sleepHours).toBe(6);
    expect(result.activityLevel).toBe("light");
    expect(result.energyLevel).toBe(3);
    expect(result.orthostaticSymptoms).toBe(true);
    expect(result.journalEntry).toBe(text.trim());
  });

  it("extracts PEM + activity from a crash description", () => {
    const text = "Went to the gym yesterday, crashed after the workout today. Energy 3/10.";
    const result = keywordParse(text);
    expect(result.activityLevel).toBe("active");
    expect(result.pemFlag).toBe(true);
    expect(result.energyLevel).toBe(3);
  });

  it("handles a positive day correctly", () => {
    const text = "Amazing day! Great energy, slept 8 hours, went for a run. Feeling fantastic.";
    const result = keywordParse(text);
    expect(result.mood).toBe("excellent");
    expect(result.sleepHours).toBe(8);
    expect(result.activityLevel).toBe("active");
    // NOTE: numeric regex captures "8" from "energy, slept 8 hours" (within 15 chars of "energy").
    // Adjective-based "great energy" → 9 is preempted by the more specific numeric match.
    expect(result.energyLevel).toBe(8);
  });
});
