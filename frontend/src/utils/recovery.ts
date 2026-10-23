// Muscles trained within this window get a recovery warning
export const RECOVERY_HOURS = 48;

type RecentSession = {
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  exercises: {
    exercise: string | { mainTargetMuscle?: string };
    sets?: { completed?: boolean }[];
  }[];
};

// Most recent time each muscle was trained, keyed by lower-case muscle name.
// An exercise only counts if at least one of its sets was completed.
export function lastTrainedByMuscle(
  sessions: RecentSession[],
  now = Date.now(),
): Map<string, Date> {
  const result = new Map<string, Date>();
  const windowMs = RECOVERY_HOURS * 60 * 60 * 1000;

  for (const session of sessions) {
    const when = new Date(
      session.completedAt ?? session.startedAt ?? session.createdAt,
    );
    const age = now - when.getTime();
    if (Number.isNaN(age) || age < 0 || age > windowMs) continue;

    for (const ex of session.exercises) {
      const muscle =
        typeof ex.exercise === "object"
          ? ex.exercise.mainTargetMuscle?.toLowerCase()
          : undefined;
      if (!muscle || !ex.sets?.some((set) => set.completed)) continue;

      const previous = result.get(muscle);
      if (!previous || previous < when) result.set(muscle, when);
    }
  }

  return result;
}
