import {
  estimateExerciseSeconds,
  estimateWorkout,
} from "./estimate-workout-time";

describe("estimateExerciseSeconds", () => {
  it("uses typical defaults for strength exercises", () => {
    // 3 × 45s work + 2 × 90s rest + 60s changeover
    expect(estimateExerciseSeconds({ category: "strength" })).toBe(375);
  });

  it("prefers template targets", () => {
    // 5 × 30s work + 4 × 120s rest + 60s changeover
    expect(
      estimateExerciseSeconds({
        targetSets: 5,
        workSeconds: 30,
        restSeconds: 120,
      }),
    ).toBe(690);
  });

  it("allows zero rest", () => {
    expect(estimateExerciseSeconds({ targetSets: 2, restSeconds: 0 })).toBe(
      2 * 45 + 60,
    );
  });

  it("uses the exercise duration for cardio", () => {
    expect(
      estimateExerciseSeconds({ category: "cardio", durationMinutes: 30 }),
    ).toBe(30 * 60 + 60);
    expect(estimateExerciseSeconds({ category: "cardio" })).toBe(20 * 60 + 60);
  });
});

describe("estimateWorkout", () => {
  it("is zero with no exercises", () => {
    expect(estimateWorkout([])).toEqual({ minutes: 0, sets: 0 });
  });

  it("rounds to 5 minutes and counts strength sets", () => {
    const six = Array.from({ length: 6 }, () => ({ category: "strength" }));
    // 6 × 375s = 37.5 min
    expect(estimateWorkout(six)).toEqual({ minutes: 40, sets: 18 });
    expect(
      estimateWorkout([...six, { category: "cardio", durationMinutes: 15 }]),
    ).toEqual({ minutes: 55, sets: 18 });
  });

  it("never estimates under 5 minutes", () => {
    expect(estimateWorkout([{ targetSets: 1, restSeconds: 0 }]).minutes).toBe(
      5,
    );
  });
});
