import { daysSince, HISTORY_DAYS, isRecovering } from "./training-history";

type Candidate = {
  _id: string;
  name: string;
  mainTargetMuscle: string;
  category?: string;
  difficulty?: string;
  isCompound?: boolean;
};

export type Suggestion<T extends Candidate> = { exercise: T; reason: string };

// If the plan works any trigger muscle but not the target, suggest the target
const BALANCE_RULES: { triggers: string[]; target: string; reason: string }[] =
  [
    {
      triggers: ["chest", "shoulders", "triceps"],
      target: "back",
      reason: "Balance your pushing with a pull",
    },
    {
      triggers: ["back", "biceps", "rear deltoids"],
      target: "chest",
      reason: "Balance your pulling with a push",
    },
    {
      triggers: ["quads"],
      target: "hamstrings",
      reason: "Pair quads with hamstrings",
    },
    {
      triggers: ["hamstrings", "glutes"],
      target: "quads",
      reason: "Pair with a quad exercise",
    },
    {
      triggers: ["biceps"],
      target: "triceps",
      reason: "Pair biceps with triceps",
    },
    {
      triggers: ["triceps"],
      target: "biceps",
      reason: "Pair triceps with biceps",
    },
  ];

// Muscles worth nudging about when they've been left out for a while
const MAJOR_MUSCLES = [
  "chest",
  "back",
  "shoulders",
  "quads",
  "hamstrings",
  "glutes",
  "biceps",
  "triceps",
  "abs",
  "calves",
];
export const NEGLECT_DAYS = 7;

// "core" in a plan covers abs
const ALIASES: Record<string, string> = { core: "abs" };

const DIFFICULTY_RANK: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

// Compound strength moves first, then easier ones, then by name
function bestFor<T extends Candidate>(muscle: string, candidates: T[]) {
  return candidates
    .filter((ex) => ex.mainTargetMuscle.toLowerCase() === muscle)
    .sort(
      (a, b) =>
        Number(!!b.isCompound) - Number(!!a.isCompound) ||
        Number(b.category === "strength") - Number(a.category === "strength") ||
        (DIFFICULTY_RANK[a.difficulty ?? ""] ?? 1) -
          (DIFFICULTY_RANK[b.difficulty ?? ""] ?? 1) ||
        a.name.localeCompare(b.name),
    )[0];
}

export function suggestExercises<T extends Candidate>({
  planMuscles,
  planExerciseIds,
  exercises,
  lastTrained,
  now = Date.now(),
  limit = 4,
}: {
  planMuscles: string[];
  planExerciseIds: string[];
  exercises: T[];
  // Lower-case muscle → last trained, covering the history window
  lastTrained: Map<string, Date>;
  now?: number;
  limit?: number;
}): Suggestion<T>[] {
  const inPlan = new Set(
    planMuscles.map((m) => ALIASES[m.toLowerCase()] ?? m.toLowerCase()),
  );
  const candidates = exercises.filter(
    (ex) => !planExerciseIds.includes(ex._id),
  );
  const available = (muscle: string) =>
    !inPlan.has(muscle) && !isRecovering(lastTrained.get(muscle), now);

  const reasons: { muscle: string; reason: string }[] = [];

  for (const rule of BALANCE_RULES) {
    if (rule.triggers.some((m) => inPlan.has(m)) && available(rule.target)) {
      reasons.push({ muscle: rule.target, reason: rule.reason });
    }
  }

  // Longest-neglected first; muscles with no history in the window lead
  const neglected = MAJOR_MUSCLES.filter(available)
    .map((muscle) => {
      const last = lastTrained.get(muscle);
      return { muscle, days: last ? daysSince(last, now) : Infinity };
    })
    .filter(({ days }) => days >= NEGLECT_DAYS)
    .sort((a, b) => b.days - a.days);

  for (const { muscle, days } of neglected) {
    reasons.push({
      muscle,
      reason:
        days === Infinity
          ? `Not trained in ${HISTORY_DAYS}+ days`
          : `Not trained in ${days} days`,
    });
  }

  const suggestions: Suggestion<T>[] = [];
  const seen = new Set<string>();
  for (const { muscle, reason } of reasons) {
    if (seen.has(muscle) || suggestions.length >= limit) continue;
    seen.add(muscle);
    const exercise = bestFor(muscle, candidates);
    if (exercise) suggestions.push({ exercise, reason });
  }
  return suggestions;
}
