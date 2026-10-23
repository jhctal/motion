import { sessionsToCsv } from "./export-logs";
import { csvToSessions, jsonToSessions, parseCsv } from "./import-logs";

const session = {
  _id: "s1",
  name: "=Push, day",
  status: "completed",
  createdAt: "2026-10-20T08:00:00.000Z",
  startedAt: "2026-10-20T08:00:00.000Z",
  rating: 4,
  feeling: "good",
  exercises: [
    {
      exercise: { name: "Bench press", category: "strength", mainTargetMuscle: "chest" },
      sets: [
        { setNumber: 1, reps: 8, weight: 60, completed: true },
        { setNumber: 2, reps: 6, weight: 65, completed: false, notes: 'felt "heavy"\nok' },
      ],
    },
    { exercise: { name: "Dips" }, sets: [] },
    { exercise: { name: "Bench press" }, sets: [{ setNumber: 1, reps: 10, weight: 40 }] },
  ],
};

describe("parseCsv", () => {
  it("handles quoted commas, quotes and newlines", () => {
    expect(parseCsv('a,"b,c","d ""e""\nf"\r\n1,2,3\n')).toEqual([
      ["a", "b,c", 'd "e"\nf'],
      ["1", "2", "3"],
    ]);
  });
});

describe("csvToSessions", () => {
  it("round-trips an exported CSV", () => {
    const [imported, ...rest] = csvToSessions(
      sessionsToCsv([session, { ...session, _id: "s2", exercises: [] }]),
    );
    expect(rest).toHaveLength(1);
    expect(imported).toMatchObject({
      _id: "s1",
      name: "=Push, day",
      status: "completed",
      createdAt: "2026-10-20T08:00:00.000Z",
      rating: "4",
      feeling: "good",
    });
    expect(imported.exercises.map((ex) => [ex.exercise.name, ex.sets.length])).toEqual([
      ["Bench press", 2],
      ["Dips", 0],
      ["Bench press", 1],
    ]);
    expect(imported.exercises[0].sets[1]).toMatchObject({
      setNumber: "2",
      reps: "6",
      weight: "65",
      completed: false,
      notes: 'felt "heavy"\nok',
    });
  });

  it("rejects CSVs that aren't workout exports", () => {
    expect(() => csvToSessions("name,amount\nfoo,1")).toThrow();
  });
});

describe("jsonToSessions", () => {
  it("accepts arrays, list responses and single sessions", () => {
    expect(jsonToSessions(JSON.stringify([session]))).toHaveLength(1);
    expect(jsonToSessions(JSON.stringify({ workoutSessions: [session] }))).toHaveLength(1);
    expect(jsonToSessions(JSON.stringify(session))).toHaveLength(1);
    expect(() => jsonToSessions("{}")).toThrow();
  });
});
