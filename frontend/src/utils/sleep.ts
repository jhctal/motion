import type { SleepLog } from "../api/sleep/use-sleep-logs";

export const SLEEP_QUALITIES = ["poor", "fair", "good", "excellent"] as const;
export type SleepQuality = (typeof SLEEP_QUALITIES)[number];

// Nightly goal for the chart's target line and the streak
export const SLEEP_TARGET_MINUTES = 8 * 60;

// "YYYY-MM-DD" for a date in the user's own timezone
export function localDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Shift a "YYYY-MM-DD" key by whole days
export function addDays(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  return localDateKey(new Date(y, m - 1, d + days));
}

// Local Date for a "YYYY-MM-DD" key, at midnight
export function keyToDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// The night a log belongs to. The date is sent as a plain "YYYY-MM-DD" and
// stored as UTC midnight, so the UTC calendar day is the one the user picked.
export function nightKey(log: Pick<SleepLog, "date">) {
  return log.date.slice(0, 10);
}

// Turn the form's night + clock times into real timestamps. "Night" is the
// evening you went to bed: a bed time before noon is after midnight, and the
// wake time is the first one after the bed time.
export function buildSleepTimes(night: string, bed: string, wake: string) {
  const bedTime = new Date(`${night}T${bed}`);
  if (bedTime.getHours() < 12) bedTime.setDate(bedTime.getDate() + 1);

  const [wakeHour, wakeMinute] = wake.split(":").map(Number);
  const wakeTime = new Date(bedTime);
  wakeTime.setHours(wakeHour, wakeMinute, 0, 0);
  if (wakeTime <= bedTime) wakeTime.setDate(wakeTime.getDate() + 1);

  return { bedTime, wakeTime };
}

// Duration with older logs saved before the overnight fix (wake time on the
// same day as bed, so negative) corrected
export function sleepMinutes(log: Pick<SleepLog, "durationMinutes">) {
  const minutes = log.durationMinutes ?? 0;
  return minutes < 0 ? minutes + 24 * 60 : minutes;
}

export type Night = {
  key: string;
  minutes: number;
  quality: SleepQuality;
  bedTime: Date;
  wakeTime: Date;
};

// One entry per night: durations add up (e.g. a split night), the rest
// comes from the earliest bed time and latest wake time
export function groupByNight(logs: SleepLog[]) {
  const nights = new Map<string, Night>();
  for (const log of logs) {
    const key = nightKey(log);
    const bedTime = new Date(log.bedTime);
    const wakeTime = new Date(log.wakeTime);
    const existing = nights.get(key);
    if (!existing) {
      nights.set(key, {
        key,
        minutes: sleepMinutes(log),
        quality: log.quality,
        bedTime,
        wakeTime,
      });
      continue;
    }
    existing.minutes += sleepMinutes(log);
    if (bedTime < existing.bedTime) existing.bedTime = bedTime;
    if (wakeTime > existing.wakeTime) {
      existing.wakeTime = wakeTime;
      existing.quality = log.quality;
    }
  }
  return nights;
}

// The most recent night that counts: tonight once it's logged, otherwise
// last night
export function latestNightKey(nights: Map<string, Night>, now = new Date()) {
  const today = localDateKey(now);
  return nights.has(today) ? today : addDays(today, -1);
}

// Consecutive logged nights ending at the latest night
export function loggedStreak(nights: Map<string, Night>, now = new Date()) {
  let key = latestNightKey(nights, now);
  let streak = 0;
  while (nights.has(key)) {
    streak++;
    key = addDays(key, -1);
  }
  return streak;
}

// Average of `count` nights ending at `endKey`, over the nights logged
export function averageMinutes(
  nights: Map<string, Night>,
  endKey: string,
  count: number,
) {
  const logged: number[] = [];
  for (let i = 0; i < count; i++) {
    const night = nights.get(addDays(endKey, -i));
    if (night) logged.push(night.minutes);
  }
  if (!logged.length) return null;
  return Math.round(logged.reduce((a, b) => a + b, 0) / logged.length);
}

// Average clock time in minutes after midnight. Times are measured from
// `pivot` (minutes after midnight) so bed times either side of midnight
// average to around midnight rather than midday.
export function averageClock(times: Date[], pivot = 12 * 60) {
  if (!times.length) return null;
  const offsets = times.map(
    (t) => (t.getHours() * 60 + t.getMinutes() - pivot + 24 * 60) % (24 * 60),
  );
  const mean = offsets.reduce((a, b) => a + b, 0) / offsets.length;
  return Math.round(mean + pivot) % (24 * 60);
}

// Clock time for a number of minutes after midnight, in the user's locale
export function clockDate(minutes: number) {
  const d = new Date(2000, 0, 1);
  d.setMinutes(minutes);
  return d;
}

// "HH:MM" in local time, for a time input
export function timeInputValue(date: string | Date) {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Short form for durations, e.g. "7h 55m"
export function formatSleep(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function lastNightKey(now = new Date()) {
  return addDays(localDateKey(now), -1);
}
