// Muscles in the same area share a colour family. Class strings are written
// out in full so Tailwind can find them.
type Family =
  | "red"
  | "blue"
  | "indigo"
  | "sky"
  | "amber"
  | "orange"
  | "violet"
  | "fuchsia"
  | "purple"
  | "emerald"
  | "green"
  | "lime"
  | "teal"
  | "cyan"
  | "yellow";

const MUSCLE_FAMILY: Record<string, Family> = {
  chest: "red",
  back: "blue",
  "lower back": "indigo",
  traps: "sky",
  shoulders: "amber",
  "rear deltoids": "orange",
  "rotator cuff": "orange",
  biceps: "violet",
  triceps: "fuchsia",
  forearms: "purple",
  quads: "emerald",
  hamstrings: "green",
  glutes: "lime",
  calves: "teal",
  "tibialis anterior": "teal",
  adductors: "cyan",
  abductors: "cyan",
  "hip flexors": "cyan",
  abs: "yellow",
  core: "yellow",
  obliques: "yellow",
};

const TAG: Record<Family, string> = {
  red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  indigo:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  sky: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  orange:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  violet:
    "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  fuchsia:
    "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-300",
  purple:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  emerald:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  lime: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300",
  teal: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  yellow:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

const FILL: Record<Family, string> = {
  red: "fill-red-400 dark:fill-red-500",
  blue: "fill-blue-400 dark:fill-blue-500",
  indigo: "fill-indigo-400 dark:fill-indigo-500",
  sky: "fill-sky-400 dark:fill-sky-500",
  amber: "fill-amber-400 dark:fill-amber-500",
  orange: "fill-orange-400 dark:fill-orange-500",
  violet: "fill-violet-400 dark:fill-violet-500",
  fuchsia: "fill-fuchsia-400 dark:fill-fuchsia-500",
  purple: "fill-purple-400 dark:fill-purple-500",
  emerald: "fill-emerald-400 dark:fill-emerald-500",
  green: "fill-green-400 dark:fill-green-500",
  lime: "fill-lime-400 dark:fill-lime-500",
  teal: "fill-teal-400 dark:fill-teal-500",
  cyan: "fill-cyan-400 dark:fill-cyan-500",
  yellow: "fill-yellow-400 dark:fill-yellow-500",
};

const family = (muscle: string) => MUSCLE_FAMILY[muscle.toLowerCase()];

export function muscleTagClass(muscle: string) {
  const f = family(muscle);
  return f
    ? TAG[f]
    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
}

export function muscleFillClass(muscle: string) {
  const f = family(muscle);
  return f ? FILL[f] : "fill-gray-400 dark:fill-gray-500";
}
