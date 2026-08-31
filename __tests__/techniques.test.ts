import { describe, it, expect } from "vitest";
import { computeTechniqueDebt, computeAdherenceByAssignment } from "@/lib/domain/techniques";

// Base assignment used across tests — represents a typical 1×/day technique
const BASE_ASSIGNMENT = {
  frequencyPerDay: 1,
  safetyCapMultiplier: 150, // 1.5× daily target
  maxDebtDays: 7,
  startDate: "2024-01-01",
  endDate: null,
  isActive: true,
};

describe("computeTechniqueDebt", () => {
  describe("no debt scenarios", () => {
    it("returns zero debt when all days are fully completed", () => {
      const today = "2024-01-08";
      const logs: Record<string, number> = {
        "2024-01-07": 1,
        "2024-01-06": 1,
        "2024-01-05": 1,
        "2024-01-04": 1,
        "2024-01-03": 1,
        "2024-01-02": 1,
        "2024-01-01": 1,
      };
      const result = computeTechniqueDebt(BASE_ASSIGNMENT, logs, today);
      expect(result.rawDebt).toBe(0);
      expect(result.catchUpReps).toBe(0);
      expect(result.todayCompleted).toBe(0);
      expect(result.dailyTarget).toBe(1);
    });

    it("returns zero debt on the first day (no prior days to check)", () => {
      const result = computeTechniqueDebt(
        { ...BASE_ASSIGNMENT, startDate: "2024-01-01" },
        {},
        "2024-01-01",
      );
      expect(result.rawDebt).toBe(0);
      expect(result.catchUpReps).toBe(0);
    });

    it("today's completions do not reduce raw debt (debt is past days only)", () => {
      const today = "2024-01-08";
      const logs = { [today]: 5 }; // lots done today, nothing yesterday
      const result = computeTechniqueDebt(BASE_ASSIGNMENT, logs, today);
      expect(result.rawDebt).toBeGreaterThan(0); // yesterday still missed
      expect(result.todayCompleted).toBe(5);
    });
  });

  describe("debt accumulation", () => {
    it("accumulates 1 debt per missed day within the window", () => {
      const today = "2024-01-08";
      const result = computeTechniqueDebt(BASE_ASSIGNMENT, {}, today);
      // maxDebtDays=7, but startDate=Jan 1 means Jan 7, 6, 5, 4, 3, 2, 1 = 7 days
      expect(result.rawDebt).toBe(7);
    });

    it("only counts days since startDate — ignores days before assignment began", () => {
      const today = "2024-01-04";
      const result = computeTechniqueDebt(
        { ...BASE_ASSIGNMENT, startDate: "2024-01-03" }, // started 2 days ago
        {},
        today,
      );
      // Only Jan 3 is before today and after startDate
      expect(result.rawDebt).toBe(1);
    });

    it("partial completions reduce debt for that day", () => {
      const today = "2024-01-08";
      const assignment = { ...BASE_ASSIGNMENT, frequencyPerDay: 3 };
      const logs = { "2024-01-07": 2 }; // 2 of 3 done yesterday
      const result = computeTechniqueDebt(assignment, logs, today);
      // yesterday: 1 missed; older days: 3 each
      expect(result.rawDebt).toBe(1 + 3 * 6);
    });

    it("does not count excess completions as negative debt", () => {
      const today = "2024-01-08";
      const logs = { "2024-01-07": 10 }; // way over target
      const result = computeTechniqueDebt(BASE_ASSIGNMENT, logs, today);
      // yesterday: fully done (capped at 0, not negative)
      expect(result.rawDebt).toBe(6); // 6 other days missed
    });
  });

  describe("safety cap (PEM protection)", () => {
    it("caps catch-up reps at safetyCapReps minus today's completions", () => {
      const today = "2024-01-08";
      // 7 days of debt = 7 raw; safety cap = floor(1 * 1.5) = 1
      const result = computeTechniqueDebt(BASE_ASSIGNMENT, {}, today);
      expect(result.safetyCapReps).toBe(1);
      expect(result.catchUpReps).toBe(1); // capped at safety cap
    });

    it("reduces catch-up reps by what's already done today", () => {
      const today = "2024-01-08";
      const logs = { [today]: 1 }; // already hit today's target
      const result = computeTechniqueDebt(BASE_ASSIGNMENT, logs, today);
      // safety cap = 1, today done = 1 → no more reps allowed
      expect(result.catchUpReps).toBe(0);
    });

    it("higher safety cap multiplier allows more catch-up", () => {
      const today = "2024-01-08";
      const assignment = {
        ...BASE_ASSIGNMENT,
        frequencyPerDay: 2,
        safetyCapMultiplier: 200, // 2× = 4 max per day
      };
      const result = computeTechniqueDebt(assignment, {}, today);
      expect(result.safetyCapReps).toBe(4);
      // 7 days × 2 target = 14 raw debt, capped at 4
      expect(result.catchUpReps).toBe(4);
    });

    it("catch-up is never negative", () => {
      const today = "2024-01-08";
      const logs = { [today]: 100 }; // absurdly over target
      const result = computeTechniqueDebt(BASE_ASSIGNMENT, logs, today);
      expect(result.catchUpReps).toBe(0);
    });
  });

  describe("end date handling", () => {
    it("ignores days after the assignment end date", () => {
      const today = "2024-01-10";
      const assignment = {
        ...BASE_ASSIGNMENT,
        startDate: "2024-01-01",
        endDate: "2024-01-05",
      };
      // Days within window: Jan 3–9 (7 days back from Jan 10)
      // Only Jan 3, 4, 5 count (endDate = Jan 5)
      const result = computeTechniqueDebt(assignment, {}, today);
      expect(result.rawDebt).toBe(3);
    });
  });

  describe("daily target reflects frequencyPerDay", () => {
    it("returns the frequencyPerDay as dailyTarget", () => {
      const result = computeTechniqueDebt(
        { ...BASE_ASSIGNMENT, frequencyPerDay: 3 },
        {},
        "2024-01-08",
      );
      expect(result.dailyTarget).toBe(3);
    });
  });
});

describe("computeAdherenceByAssignment", () => {
  const assignments = [
    { id: "a1", frequencyPerDay: 1 },
    { id: "a2", frequencyPerDay: 2 },
  ];

  it("returns empty map when there are no logs", () => {
    expect(computeAdherenceByAssignment(assignments, [])).toEqual({});
  });

  it("counts a day as met when completedReps >= frequencyPerDay", () => {
    const logs = [{ assignmentId: "a1", date: "2024-01-01", completedReps: 1 }];
    const result = computeAdherenceByAssignment(assignments, logs);
    expect(result["a1"]).toBe(1);
  });

  it("does not count a day when completedReps < frequencyPerDay", () => {
    const logs = [{ assignmentId: "a2", date: "2024-01-01", completedReps: 1 }]; // need 2
    const result = computeAdherenceByAssignment(assignments, logs);
    expect(result["a2"]).toBeUndefined();
  });

  it("uses MAX of cumulative same-day rows to check goal (each tap inserts a cumulative row)", () => {
    // Real data model: 2 taps produce rows [1, 2], not [1, 1]. MAX=2 meets goal of 2.
    const logs = [
      { assignmentId: "a2", date: "2024-01-01", completedReps: 1 },
      { assignmentId: "a2", date: "2024-01-01", completedReps: 2 }, // cumulative tap 2 → MAX=2 meets goal
    ];
    const result = computeAdherenceByAssignment(assignments, logs);
    expect(result["a2"]).toBe(1);
  });

  it("does not triple-count reps from additive rows (old SUM bug guard)", () => {
    // If someone somehow had [1,1,1], SUM=3 would wrongly count 3 days — MAX=1 correctly sees only 1 rep
    const logs = [
      { assignmentId: "a2", date: "2024-01-01", completedReps: 1 },
      { assignmentId: "a2", date: "2024-01-01", completedReps: 1 },
      { assignmentId: "a2", date: "2024-01-01", completedReps: 1 },
    ];
    const result = computeAdherenceByAssignment(assignments, logs);
    // MAX=1, goal=2 → not met → undefined
    expect(result["a2"]).toBeUndefined();
  });

  it("counts each distinct day separately", () => {
    const logs = [
      { assignmentId: "a1", date: "2024-01-01", completedReps: 1 },
      { assignmentId: "a1", date: "2024-01-02", completedReps: 1 },
      { assignmentId: "a1", date: "2024-01-03", completedReps: 1 },
    ];
    const result = computeAdherenceByAssignment(assignments, logs);
    expect(result["a1"]).toBe(3);
  });

  it("tracks multiple assignments independently", () => {
    const logs = [
      { assignmentId: "a1", date: "2024-01-01", completedReps: 1 },
      { assignmentId: "a2", date: "2024-01-01", completedReps: 2 },
      { assignmentId: "a2", date: "2024-01-02", completedReps: 2 },
    ];
    const result = computeAdherenceByAssignment(assignments, logs);
    expect(result["a1"]).toBe(1);
    expect(result["a2"]).toBe(2);
  });

  it("ignores logs for unknown assignment IDs", () => {
    const logs = [{ assignmentId: "unknown", date: "2024-01-01", completedReps: 5 }];
    const result = computeAdherenceByAssignment(assignments, logs);
    expect(Object.keys(result)).toHaveLength(0);
  });
});
