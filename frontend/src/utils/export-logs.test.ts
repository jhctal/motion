import { sessionsToCsv } from "./export-logs";

const session = {
  _id: "s1",
  name: "Push, day",
  status: "completed",
  createdAt: "2026-10-20T08:00:00.000Z",
  duration: 45,
  rating: 4,
  feeling: "good",
  exercises: [
    {
      exercise: { name: "Bench press", category: "strength", mainTargetMuscle: "chest" },
      sets: [
        { setNumber: 1, reps: 8, weight: 60, completed: true },
        { setNumber: 2, reps: 6, weight: 65, completed: false, notes: '=felt "heavy"' },
      ],
    },
    { exercise: { name: "Dips" }, sets: [] },
  ],
};

describe("sessionsToCsv", () => {
  it("writes one row per set, plus a row for exercises without sets", () => {
    const lines = sessionsToCsv([session]).split("\r\n");
    expect(lines).toHaveLength(4);
    expect(lines[0].split(",")[0]).toBe("session_id");
    expect(lines[1]).toBe(
      's1,"Push, day",completed,2026-10-20,,,45,4,good,Bench press,strength,chest,1,8,60,,,,,true,',
    );
    expect(lines[3]).toBe('s1,"Push, day",completed,2026-10-20,,,45,4,good,Dips,,');
  });

  it("escapes quotes and neutralises formulas", () => {
    const lines = sessionsToCsv([session]).split("\r\n");
    expect(lines[2].endsWith(',false,"\'=felt ""heavy"""')).toBe(true);
  });

  it("reads durationInSeconds from the API shape", () => {
    const csv = sessionsToCsv([
      {
        ...session,
        exercises: [
          { exercise: "Plank", sets: [{ setNumber: 1, durationInSeconds: 60 }] },
        ],
      },
    ]);
    expect(csv.split("\r\n")[1]).toContain("Plank,,,1,,,60,");
  });
});
