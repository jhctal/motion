import type { SleepLog } from "../api/sleep/use-sleep-logs";
import {
  addDays,
  averageClock,
  averageMinutes,
  buildSleepTimes,
  groupByNight,
  loggedStreak,
  sleepMinutes,
} from "./sleep";

const minutesBetween = (a: Date, b: Date) =>
  (b.getTime() - a.getTime()) / 60_000;

const log = (
  date: string,
  durationMinutes: number,
  overrides: Partial<SleepLog> = {},
): SleepLog => ({
  _id: date,
  user: "u",
  date: `${date}T00:00:00.000Z`,
  bedTime: `${date}T23:00:00`,
  wakeTime: `${addDays(date, 1)}T07:00:00`,
  durationMinutes,
  quality: "good",
  createdAt: "",
  updatedAt: "",
  ...overrides,
});

describe("buildSleepTimes", () => {
  it("puts the wake time on the next morning for overnight sleep", () => {
    const { bedTime, wakeTime } = buildSleepTimes(
      "2026-10-23",
      "23:10",
      "07:05",
    );
    expect(bedTime.getDate()).toBe(23);
    expect(wakeTime.getDate()).toBe(24);
    expect(minutesBetween(bedTime, wakeTime)).toBe(475);
  });

  it("treats a bed time after midnight as the next calendar day", () => {
    const { bedTime, wakeTime } = buildSleepTimes(
      "2026-10-23",
      "01:30",
      "08:00",
    );
    expect(bedTime.getDate()).toBe(24);
    expect(wakeTime.getDate()).toBe(24);
    expect(minutesBetween(bedTime, wakeTime)).toBe(390);
  });

  it("keeps an afternoon nap on the same day", () => {
    const { bedTime, wakeTime } = buildSleepTimes(
      "2026-10-23",
      "14:00",
      "15:30",
    );
    expect(wakeTime.getDate()).toBe(23);
    expect(minutesBetween(bedTime, wakeTime)).toBe(90);
  });
});

describe("sleepMinutes", () => {
  it("corrects durations saved negative before the overnight fix", () => {
    expect(sleepMinutes({ durationMinutes: -960 })).toBe(480);
    expect(sleepMinutes({ durationMinutes: 420 })).toBe(420);
  });
});

describe("night stats", () => {
  const now = new Date("2026-10-24T10:00:00");

  it("counts consecutive nights back from last night", () => {
    const nights = groupByNight([
      log("2026-10-23", 480),
      log("2026-10-22", 400),
      log("2026-10-20", 450),
    ]);
    expect(loggedStreak(nights, now)).toBe(2);
  });

  it("has no streak when last night is missing", () => {
    expect(loggedStreak(groupByNight([log("2026-10-21", 480)]), now)).toBe(0);
  });

  it("averages only the nights that were logged", () => {
    const nights = groupByNight([
      log("2026-10-23", 480),
      log("2026-10-21", 420),
    ]);
    expect(averageMinutes(nights, "2026-10-23", 7)).toBe(450);
    expect(averageMinutes(nights, "2026-10-14", 7)).toBeNull();
  });

  it("adds up two logs on the same night", () => {
    const nights = groupByNight([
      log("2026-10-23", 300, { _id: "a" }),
      log("2026-10-23", 120, { _id: "b" }),
    ]);
    expect(nights.get("2026-10-23")?.minutes).toBe(420);
  });
});

describe("averageClock", () => {
  it("averages bed times across midnight to around midnight", () => {
    const times = [
      new Date("2026-10-23T23:00:00"),
      new Date("2026-10-24T01:00:00"),
    ];
    expect(averageClock(times)).toBe(0);
  });

  it("averages morning wake times from midnight", () => {
    const times = [
      new Date("2026-10-24T06:30:00"),
      new Date("2026-10-24T07:30:00"),
    ];
    expect(averageClock(times, 0)).toBe(7 * 60);
  });
});
