// Picks for the decorative dashboard cards: which scene and caption show
// today, and which season's particles drift around them.

export type Season = "winter" | "spring" | "summer" | "autumn";

export const SEASONS: readonly Season[] = [
  "winter",
  "spring",
  "summer",
  "autumn",
];

// Counted in calendar days via UTC, so a clock change (e.g. into summer
// time) can't shift the count by an hour and flip the pick at 1am
export function dayOfYear(date: Date) {
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const start = Date.UTC(date.getFullYear(), 0, 0);
  return (today - start) / 86_400_000;
}

// Same pick for everyone on a given day, cycling through the list
export function pickDaily<T>(items: readonly T[], date = new Date()) {
  return items[dayOfYear(date) % items.length];
}

// Northern-hemisphere meteorological seasons
export function seasonOf(date = new Date()): Season {
  const month = date.getMonth();
  if (month === 11 || month <= 1) return "winter";
  if (month <= 4) return "spring";
  if (month <= 7) return "summer";
  return "autumn";
}

// Dev-only preview: add ?art=<scene>&season=<season> to the dashboard URL to
// see any scene or season without waiting for the date to change. Unknown
// values fall back to today's pick.
export function previewOverride<T extends string>(
  param: "art" | "season",
  allowed: readonly T[],
): T | null {
  if (!import.meta.env.DEV || typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get(param);
  return allowed.includes(value as T) ? (value as T) : null;
}

// Scenes each card rotates through, one per day
export const LIFT_SCENES = [
  "dumbbell",
  "barbell",
  "kettlebell",
  "shoe",
] as const;
export type LiftScene = (typeof LIFT_SCENES)[number];

export const SCALE_SCENES = ["scale", "tape", "bottle"] as const;
export type ScaleScene = (typeof SCALE_SCENES)[number];
