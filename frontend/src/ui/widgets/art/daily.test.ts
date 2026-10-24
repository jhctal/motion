import { dayOfYear, pickDaily, seasonOf } from "./daily";

describe("pickDaily", () => {
  const items = ["a", "b", "c"];

  it("gives the same pick all day", () => {
    expect(pickDaily(items, new Date("2026-10-24T00:05:00"))).toBe(
      pickDaily(items, new Date("2026-10-24T23:55:00")),
    );
  });

  it("moves to the next item the next day, wrapping round", () => {
    const today = new Date("2026-10-24T12:00:00");
    const i = items.indexOf(pickDaily(items, today));
    const tomorrow = new Date("2026-10-25T12:00:00");
    expect(pickDaily(items, tomorrow)).toBe(items[(i + 1) % items.length]);
  });
});

describe("dayOfYear", () => {
  it("counts 1 January as day 1", () => {
    expect(dayOfYear(new Date("2026-01-01T12:00:00"))).toBe(1);
    expect(dayOfYear(new Date("2026-12-31T12:00:00"))).toBe(365);
  });
});

describe("seasonOf", () => {
  it.each([
    ["2026-12-01", "winter"],
    ["2026-01-15", "winter"],
    ["2026-02-28", "winter"],
    ["2026-03-01", "spring"],
    ["2026-05-31", "spring"],
    ["2026-06-01", "summer"],
    ["2026-08-31", "summer"],
    ["2026-09-01", "autumn"],
    ["2026-11-30", "autumn"],
  ])("%s is %s", (date, season) => {
    expect(seasonOf(new Date(`${date}T12:00:00`))).toBe(season);
  });
});
