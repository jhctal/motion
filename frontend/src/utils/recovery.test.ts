import { lastTrainedByMuscle } from "./recovery";
import { formatRelativeDay } from "./format-date";

const now = new Date("2026-10-23T18:00:00").getTime();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();

const session = (
  when: string,
  exercises: { muscle: string; done: boolean }[],
) => ({
  createdAt: when,
  completedAt: when,
  exercises: exercises.map(({ muscle, done }) => ({
    exercise: { mainTargetMuscle: muscle },
    sets: [{ completed: done }],
  })),
});

describe("lastTrainedByMuscle", () => {
  it("keeps the most recent time per muscle within 48h", () => {
    const result = lastTrainedByMuscle(
      [
        session(hoursAgo(30), [{ muscle: "Chest", done: true }]),
        session(hoursAgo(5), [{ muscle: "chest", done: true }]),
        session(hoursAgo(10), [{ muscle: "Triceps", done: true }]),
      ],
      now,
    );
    expect([...result.keys()].sort()).toEqual(["chest", "triceps"]);
    expect(result.get("chest")?.toISOString()).toBe(hoursAgo(5));
  });

  it("ignores old sessions, future dates and exercises with no completed sets", () => {
    const result = lastTrainedByMuscle(
      [
        session(hoursAgo(49), [{ muscle: "back", done: true }]),
        session(hoursAgo(-2), [{ muscle: "quads", done: true }]),
        session(hoursAgo(3), [{ muscle: "biceps", done: false }]),
        {
          createdAt: hoursAgo(1),
          exercises: [
            { exercise: "unpopulated-id", sets: [{ completed: true }] },
          ],
        },
      ],
      now,
    );
    expect(result.size).toBe(0);
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
