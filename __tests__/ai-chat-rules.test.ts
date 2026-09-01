/**
 * Unit tests for the rule-based AI response path in lib/domain/ai-chat.ts.
 * This is the fallback used when no chain provider is configured.
 * ruleBasedResponse is a pure function: no DB, no network.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/domain/embeddings", () => ({
  semanticCheckInSearch: vi.fn().mockResolvedValue(null),
}));

import {
  ruleBasedResponse,
  type CheckInRow,
  type MedicationRow,
  type AssessmentRow,
} from "@/lib/domain/ai-chat";
import { DAY_MS, SEVEN_DAYS_MS } from "@/lib/constants";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function row(overrides: Partial<CheckInRow> = {}): CheckInRow {
  return {
    id: "test-id",
    createdAt: new Date(),
    mood: "neutral",
    energyLevel: 5,
    sleepHours: null,
    sleepQuality: null,
    activityLevel: null,
    pemFlag: null,
    pemSeverity: null,
    orthostaticSymptoms: null,
    symptomFatigue: null,
    symptomBrainFog: null,
    symptomPain: null,
    stressLevel: null,
    journalEntry: null,
    wins: null,
    challenges: null,
    notes: null,
    ...overrides,
  } as CheckInRow;
}

const NO_MEDS: MedicationRow[] = [];
const NO_ASSESSMENT: AssessmentRow | undefined = undefined;

// ─── Empty state ─────────────────────────────────────────────────────────────

describe("ruleBasedResponse — empty state", () => {
  it("returns onboarding message when no rows", () => {
    const reply = ruleBasedResponse("How is my energy?", [], NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("haven't logged any check-ins yet");
  });
});

// ─── PEM branch ──────────────────────────────────────────────────────────────

describe("ruleBasedResponse — PEM", () => {
  it("reports no PEM when none recorded", () => {
    const rows = [row({ pemFlag: false }), row({ pemFlag: false })];
    const reply = ruleBasedResponse("Have I had any PEM?", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("haven't flagged any PEM episodes");
  });

  it("reports PEM count when episodes exist", () => {
    const rows = [row({ pemFlag: true }), row({ pemFlag: true }), row({ pemFlag: false })];
    const reply = ruleBasedResponse(
      "Tell me about my crash patterns",
      rows,
      NO_MEDS,
      NO_ASSESSMENT,
    );
    expect(reply).toContain("2 PEM episodes");
    expect(reply).toContain("worth discussing with your practitioner");
  });

  it("uses singular for exactly 1 PEM episode", () => {
    const rows = [row({ pemFlag: true }), row({ pemFlag: false })];
    const reply = ruleBasedResponse("pem", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("1 PEM episode");
    expect(reply).not.toContain("episodes");
  });

  it("triggers on 'exertional' keyword", () => {
    const rows = [row()];
    const reply = ruleBasedResponse(
      "post-exertional malaise question",
      rows,
      NO_MEDS,
      NO_ASSESSMENT,
    );
    expect(reply).toContain("PEM");
  });
});

// ─── Energy branch ───────────────────────────────────────────────────────────

describe("ruleBasedResponse — energy", () => {
  it("labels energy >= 6 as above average", () => {
    const rows = [row({ energyLevel: 7 }), row({ energyLevel: 8 })];
    const reply = ruleBasedResponse("How is my energy?", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("above average");
  });

  it("labels energy 4-5 as moderate", () => {
    const rows = [row({ energyLevel: 4 }), row({ energyLevel: 5 })];
    const reply = ruleBasedResponse("I feel tired all the time", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("moderate");
  });

  it("labels energy < 4 as low", () => {
    const rows = [row({ energyLevel: 2 }), row({ energyLevel: 3 })];
    const reply = ruleBasedResponse("I'm exhausted", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("low");
  });

  it("mentions PEM when episodes exist alongside low energy", () => {
    const rows = [row({ energyLevel: 3, pemFlag: true }), row({ energyLevel: 4 })];
    const reply = ruleBasedResponse("energy", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("PEM episodes");
  });

  it("does not mention PEM when none exist", () => {
    const rows = [row({ energyLevel: 6 }), row({ energyLevel: 7 })];
    const reply = ruleBasedResponse("energy", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).not.toContain("PEM");
  });
});

// ─── Sleep branch ────────────────────────────────────────────────────────────

describe("ruleBasedResponse — sleep", () => {
  it("prompts to log sleep when no sleep data", () => {
    const rows = [row({ sleepHours: null }), row({ sleepHours: null })];
    const reply = ruleBasedResponse("How is my sleep?", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("haven't been logging your sleep hours");
  });

  it("labels >= 7.5h as good", () => {
    const rows = [row({ sleepHours: 8 }), row({ sleepHours: 8 })];
    const reply = ruleBasedResponse("Tell me about my sleep", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("good");
  });

  it("labels 6-7.5h as adequate", () => {
    const rows = [row({ sleepHours: 6 }), row({ sleepHours: 7 })];
    const reply = ruleBasedResponse("sleep", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("adequate");
  });

  it("labels < 6h as below optimal", () => {
    const rows = [row({ sleepHours: 5 }), row({ sleepHours: 4 })];
    const reply = ruleBasedResponse("insomnia is killing me", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("below optimal");
  });

  it("triggers on 'night' keyword", () => {
    const rows = [row({ sleepHours: 7 })];
    const reply = ruleBasedResponse("how did I sleep last night", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("hours");
  });
});

// ─── Mood branch ─────────────────────────────────────────────────────────────

describe("ruleBasedResponse — mood", () => {
  it("returns mostly good to excellent for avgMoodNum >= 4.5", () => {
    const rows = [row({ mood: "excellent" }), row({ mood: "good" })];
    const reply = ruleBasedResponse("How is my mood?", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("mostly good to excellent");
  });

  it("returns generally neutral to good for avgMoodNum 3.5-4.5", () => {
    const rows = [row({ mood: "good" }), row({ mood: "neutral" })];
    const reply = ruleBasedResponse("How is my mood?", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("generally neutral to good");
  });

  it("returns mixed for avgMoodNum 2.5-3.5", () => {
    const rows = [row({ mood: "neutral" }), row({ mood: "low" })];
    const reply = ruleBasedResponse("mood", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("mixed");
  });

  it("returns frequently low for avgMoodNum 1.5-2.5", () => {
    const rows = [row({ mood: "low" }), row({ mood: "low" })];
    const reply = ruleBasedResponse("I feel sad", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("frequently low");
  });

  it("returns frequently very low for avgMoodNum < 1.5", () => {
    const rows = [row({ mood: "very_low" }), row({ mood: "very_low" })];
    const reply = ruleBasedResponse("depressed", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("frequently very low");
  });

  it("triggers on 'anxiety' keyword", () => {
    const rows = [row({ mood: "good" })];
    const reply = ruleBasedResponse("I have anxiety", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("mood");
  });
});

// ─── Stress branch ───────────────────────────────────────────────────────────

describe("ruleBasedResponse — stress", () => {
  it("prompts to log stress when no data", () => {
    const rows = [row({ stressLevel: null })];
    const reply = ruleBasedResponse("How is my stress?", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("haven't been logging your stress levels");
  });

  it("labels avg stress >= 7 as high", () => {
    const rows = [row({ stressLevel: 8 }), row({ stressLevel: 8 })];
    const reply = ruleBasedResponse("I feel overwhelmed", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("high");
    expect(reply).toContain("Sustained stress above 7");
  });

  it("labels avg stress 5-7 as moderate", () => {
    const rows = [row({ stressLevel: 5 }), row({ stressLevel: 6 })];
    const reply = ruleBasedResponse("stress levels", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("moderate");
  });

  it("labels avg stress < 5 as relatively low", () => {
    const rows = [row({ stressLevel: 2 }), row({ stressLevel: 3 })];
    const reply = ruleBasedResponse("burnout", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("relatively low");
  });

  it("triggers on 'pressure' keyword", () => {
    const rows = [row({ stressLevel: 6 })];
    const reply = ruleBasedResponse("work pressure is intense", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("stress");
  });
});

// ─── Progress / trend branch ─────────────────────────────────────────────────

describe("ruleBasedResponse — progress", () => {
  it("returns keep-tracking message when only recent data", () => {
    const rows = [row(), row()];
    const reply = ruleBasedResponse("Am I improving?", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("Keep tracking daily");
  });

  it("detects upward energy trend", () => {
    const recent = [row({ energyLevel: 8, createdAt: new Date() })];
    const older = [
      row({ energyLevel: 4, createdAt: new Date(Date.now() - SEVEN_DAYS_MS - DAY_MS) }),
    ];
    const reply = ruleBasedResponse("progress", [...recent, ...older], NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("trending upward");
  });

  it("detects downward energy trend", () => {
    const recent = [row({ energyLevel: 3, createdAt: new Date() })];
    const older = [
      row({ energyLevel: 8, createdAt: new Date(Date.now() - SEVEN_DAYS_MS - DAY_MS) }),
    ];
    const reply = ruleBasedResponse(
      "getting worse?",
      [...recent, ...older],
      NO_MEDS,
      NO_ASSESSMENT,
    );
    expect(reply).toContain("dipped recently");
  });

  it("reports stable when energy difference < 0.5", () => {
    const recent = [row({ energyLevel: 5, createdAt: new Date() })];
    const older = [
      row({ energyLevel: 5, createdAt: new Date(Date.now() - SEVEN_DAYS_MS - DAY_MS) }),
    ];
    const reply = ruleBasedResponse("trend", [...recent, ...older], NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("stable");
  });
});

// ─── Orthostatic branch ──────────────────────────────────────────────────────

describe("ruleBasedResponse — orthostatic", () => {
  it("reassures when no orthostatic symptoms", () => {
    const rows = [row({ orthostaticSymptoms: false })];
    const reply = ruleBasedResponse("I feel dizzy sometimes", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("haven't reported dizziness on standing");
  });

  it("reports orthostatic count and flags for discussion", () => {
    const rows = [
      row({ orthostaticSymptoms: true }),
      row({ orthostaticSymptoms: true }),
      row({ orthostaticSymptoms: false }),
    ];
    const reply = ruleBasedResponse("lightheaded when standing", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("2 of your last 3 check-ins");
    expect(reply).toContain("worth discussing with your practitioner");
  });

  it("triggers on 'orthostatic' keyword", () => {
    const rows = [row()];
    const reply = ruleBasedResponse("orthostatic intolerance", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("dizziness");
  });
});

// ─── Wins / journal branch ───────────────────────────────────────────────────

describe("ruleBasedResponse — wins", () => {
  it("reports journal entry count (journalEntry and notes qualify, wins do not)", () => {
    const rows = [
      row({ journalEntry: "Good day" }),
      row({ notes: "Felt okay" }),
      row({ wins: "Walked 10 mins" }), // wins alone do not count as a journal entry
    ];
    const reply = ruleBasedResponse("What were my wins?", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("journal entries on 2 of your last 3 check-in days");
  });

  it("triggers on 'challenge' keyword", () => {
    const rows = [row()];
    const reply = ruleBasedResponse("what challenges did I face", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("journal");
  });
});

// ─── Medications branch ──────────────────────────────────────────────────────

describe("ruleBasedResponse — medications", () => {
  it("prompts to log when no medications", () => {
    const rows = [row()];
    const reply = ruleBasedResponse("What medications am I on?", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("haven't logged any current medications");
  });

  it("lists medications with dose and frequency", () => {
    const meds: MedicationRow[] = [
      {
        medicationName: "Vitamin D",
        dose: "2000 IU",
        frequency: "daily",
        startDate: "2024-01-01",
        notes: null,
      },
    ];
    const rows = [row()];
    const reply = ruleBasedResponse("my supplements", rows, meds, NO_ASSESSMENT);
    expect(reply).toContain("Vitamin D (2000 IU), daily");
  });

  it("uses singular for one medication", () => {
    const meds: MedicationRow[] = [
      {
        medicationName: "Melatonin",
        dose: null,
        frequency: null,
        startDate: "2024-01-01",
        notes: null,
      },
    ];
    const rows = [row()];
    const reply = ruleBasedResponse("medication", rows, meds, NO_ASSESSMENT);
    expect(reply).toContain("1 medication logged");
    expect(reply).not.toContain("medications logged");
  });

  it("triggers on 'tablet' keyword", () => {
    const rows = [row()];
    const reply = ruleBasedResponse("tablet I take", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("medications");
  });
});

// ─── Assessment / capacity branch ────────────────────────────────────────────

describe("ruleBasedResponse — assessment", () => {
  it("prompts to complete assessment when none recorded", () => {
    const rows = [row()];
    const reply = ruleBasedResponse("What is my capacity?", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("haven't completed a functional assessment");
  });

  it("shows overall and sub-capacities when assessment exists", () => {
    const assessment: AssessmentRow = {
      assessedAt: new Date(),
      overallCapacity: 6,
      cognitiveCapacity: 5,
      physicalCapacity: 4,
      emotionalCapacity: 7,
      socialCapacity: null,
      notes: null,
    };
    const rows = [row()];
    const reply = ruleBasedResponse("functional assessment", rows, NO_MEDS, assessment);
    expect(reply).toContain("Overall capacity: 6/10");
    expect(reply).toContain("Cognitive: 5/10");
    expect(reply).toContain("Physical: 4/10");
    expect(reply).toContain("Emotional: 7/10");
    expect(reply).not.toContain("Social");
  });
});

// ─── Generic / help branch ───────────────────────────────────────────────────

describe("ruleBasedResponse — generic help", () => {
  it("describes capabilities on 'what can you' question", () => {
    const rows = [row()];
    const reply = ruleBasedResponse("What can you help me with?", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("energy trends");
    expect(reply).toContain("PEM episodes");
  });

  it("triggers on 'how does' keyword", () => {
    const rows = [row()];
    const reply = ruleBasedResponse("how does this work", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("energy trends");
  });
});

// ─── Default / snapshot branch ───────────────────────────────────────────────

describe("ruleBasedResponse — default snapshot", () => {
  it("returns summary snapshot for unrecognised questions", () => {
    const rows = [row({ energyLevel: 6 }), row({ energyLevel: 7 })];
    const reply = ruleBasedResponse("tell me about myself", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("average energy is");
    expect(reply).toContain("PEM episode");
  });

  it("includes avg sleep in snapshot when data available", () => {
    const rows = [row({ energyLevel: 6, sleepHours: 7 }), row({ energyLevel: 7, sleepHours: 8 })];
    const reply = ruleBasedResponse("tell me about myself", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).toContain("average sleep is");
  });

  it("omits sleep from snapshot when no sleep data", () => {
    const rows = [row({ energyLevel: 6 })];
    const reply = ruleBasedResponse("general overview", rows, NO_MEDS, NO_ASSESSMENT);
    expect(reply).not.toContain("average sleep is");
  });
});
