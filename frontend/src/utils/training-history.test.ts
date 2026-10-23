import { isRecovering, summariseHistory } from "./training-history";
import { suggestExercises } from "./suggest-exercises";
import { formatRelativeDay } from "./format-date";

const now = new Date("2026-10-23T18:00:00").getTime();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();

const session = (
  when: string,
  exercises: {
    id: string;
    muscle: string;
    sets: [number, number, boolean][];
  }[],
) => ({
  createdAt: when,
  completedAt: when,
  exercises: exercises.map(({ id, muscle, sets }) => ({
    exercise: { _id: id, mainTargetMuscle: muscle },
    sets: sets.map(([weight, reps, completed]) => ({
      weight,
      reps,
      completed,
    })),
  })),
});

describe("summariseHistory", () => {
  it("tracks last trained per muscle and last completed sets per exercise", () => {
    const { lastTrained, lastPerformance } = summariseHistory(
      [
        session(hoursAgo(100), [
          { id: "bench", muscle: "Chest", sets: [[60, 10, true]] },
        ]),
        session(hoursAgo(5), [
          {
            id: "bench",
            muscle: "chest",
            sets: [
              [80, 8, true],
              [80, 6, true],
              [80, 0, false],
            ],
          },
        ]),
      ],
      now,
    );
    expect(lastTrained.get("chest")?.toISOString()).toBe(hoursAgo(5));
    expect(lastPerformance.get("bench")?.sets).toEqual([
      { weight: 80, reps: 8, durationInSeconds: 0 },
      { weight: 80, reps: 6, durationInSeconds: 0 },
    ]);
  });

  it("ignores sessions outside 14 days, in the future, or with nothing completed", () => {
    const { lastTrained, lastPerformance } = summariseHistory(
      [
        session(hoursAgo(15 * 24), [
          { id: "row", muscle: "back", sets: [[50, 10, true]] },
        ]),
        session(hoursAgo(-2), [
          { id: "squat", muscle: "quads", sets: [[100, 5, true]] },
        ]),
        session(hoursAgo(3), [
          { id: "curl", muscle: "biceps", sets: [[15, 10, false]] },
        ]),
        {
          createdAt: hoursAgo(1),
          exercises: [{ exercise: "unpopulated", sets: [{ completed: true }] }],
        },
      ],
      now,
    );
    expect(lastTrained.size).toBe(0);
    expect(lastPerformance.size).toBe(0);
  });

  it("dates a session by when it started, not when it was marked finished", () => {
    // started Wednesday evening, marked finished Thursday afternoon
    const { lastTrained } = summariseHistory(
      [
        {
          createdAt: hoursAgo(47),
          startedAt: hoursAgo(47),
          completedAt: hoursAgo(25),
          exercises: [
            {
              exercise: { _id: "bench", mainTargetMuscle: "chest" },
              sets: [{ completed: true }],
            },
          ],
        },
      ],
      now,
    );
    expect(lastTrained.get("chest")?.toISOString()).toBe(hoursAgo(47));
  });

  it("only treats the last 48h as recovering", () => {
    expect(isRecovering(new Date(hoursAgo(47)), now)).toBe(true);
    expect(isRecovering(new Date(hoursAgo(49)), now)).toBe(false);
    expect(isRecovering(undefined, now)).toBe(false);
  });
});

describe("suggestExercises", () => {
  const ex = (
    _id: string,
    mainTargetMuscle: string,
    extra: { isCompound?: boolean; difficulty?: string } = {},
  ) => ({ _id, name: _id, mainTargetMuscle, category: "strength", ...extra });

  const library = [
    ex("bench", "chest", { isCompound: true }),
    ex("cable row", "back"),
    ex("barbell row", "back", { isCompound: true, difficulty: "intermediate" }),
    ex("pull up", "back", { isCompound: true, difficulty: "advanced" }),
    ex("leg curl", "hamstrings"),
    ex("squat", "quads", { isCompound: true }),
    ex("curl", "biceps"),
  ];

  it("balances the plan with the best compound exercise", () => {
    const [first] = suggestExercises({
      planMuscles: ["Chest"],
      planExerciseIds: ["bench"],
      exercises: library,
      lastTrained: new Map(),
      now,
    });
    expect(first).toEqual({
      exercise: expect.objectContaining({ _id: "barbell row" }),
      reason: "Balance your pushing with a pull",
    });
  });

  it("suggests neglected muscles but skips recovering ones and the plan", () => {
    const suggestions = suggestExercises({
      planMuscles: ["quads"],
      planExerciseIds: ["squat"],
      exercises: library,
      lastTrained: new Map([
        ["hamstrings", new Date(hoursAgo(10))], // recovering
        ["chest", new Date(hoursAgo(9 * 24))],
        ["back", new Date(hoursAgo(3 * 24))], // trained recently enough
      ]),
      now,
      limit: 10,
    });
    const muscles = suggestions.map((s) => s.exercise.mainTargetMuscle);
    expect(muscles).not.toContain("hamstrings");
    expect(muscles).not.toContain("quads");
    expect(muscles).not.toContain("back");
    expect(suggestions).toContainEqual({
      exercise: expect.objectContaining({ _id: "bench" }),
      reason: "Not trained in 9 days",
    });
  });
});

describe("formatRelativeDay", () => {
  it("uses calendar days", () => {
    const today = new Date("2026-10-23T09:00:00");
    expect(formatRelativeDay(new Date("2026-10-23T01:00:00"), today)).toBe(
      "today",
    );
    expect(formatRelativeDay(new Date("2026-10-22T23:30:00"), today)).toBe(
      "yesterday",
    );
    expect(formatRelativeDay(new Date("2026-10-21T12:00:00"), today)).toBe(
      "2 days ago",
    );
  });
});
