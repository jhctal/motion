// One fetch of recent sessions powers recovery warnings, "last time" figures
// and exercise suggestions, so the planner never needs per-exercise requests.

// How far back the planner looks
export const HISTORY_DAYS = 14;
// Muscles trained within this window get a recovery warning
export const RECOVERY_HOURS = 48;

const HOUR_MS = 60 * 60 * 1000;

type HistorySet = {
  completed?: boolean;
  reps?: number;
  weight?: number;
  durationInSeconds?: number;
};

type HistorySession = {
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  exercises: {
    exercise: string | { _id?: string; mainTargetMuscle?: string };
    sets?: HistorySet[];
  }[];
};

export type LastPerformance = {
  date: Date;
  sets: { reps: number; weight: number; durationInSeconds: number }[];
};

export type TrainingHistory = {
  // Lower-case muscle name → most recent time it was trained
  lastTrained: Map<string, Date>;
  // Exercise id → completed sets from the most recent session that included it
  lastPerformance: Map<string, LastPerformance>;
};

// Only exercises with at least one completed set count as trained
export function summariseHistory(
  sessions: HistorySession[],
  now = Date.now(),
): TrainingHistory {
  const lastTrained = new Map<string, Date>();
  const lastPerformance = new Map<string, LastPerformance>();

  for (const session of sessions) {
    // When the training happened: sessions are often marked finished hours
    // or a day later, so completedAt can't be trusted for this
    const when = new Date(
      session.startedAt ?? session.createdAt ?? session.completedAt,
    );
    const age = now - when.getTime();
    if (Number.isNaN(age) || age < 0 || age > HISTORY_DAYS * 24 * HOUR_MS) {
      continue;
    }

    for (const ex of session.exercises) {
      if (typeof ex.exercise !== "object") continue;
      const completed = (ex.sets ?? []).filter((set) => set.completed);
      if (completed.length === 0) continue;

      const muscle = ex.exercise.mainTargetMuscle?.toLowerCase();
      if (muscle) {
        const previous = lastTrained.get(muscle);
        if (!previous || previous < when) lastTrained.set(muscle, when);
      }

      const id = ex.exercise._id;
      if (id) {
        const previous = lastPerformance.get(id);
        if (!previous || previous.date < when) {
          lastPerformance.set(id, {
            date: when,
            sets: completed.map((set) => ({
              reps: set.reps ?? 0,
              weight: set.weight ?? 0,
              durationInSeconds: set.durationInSeconds ?? 0,
            })),
          });
        }
      }
    }
  }

  return { lastTrained, lastPerformance };
}

export function isRecovering(lastTrained: Date | undefined, now = Date.now()) {
  return (
    !!lastTrained && now - lastTrained.getTime() <= RECOVERY_HOURS * HOUR_MS
  );
}

export function daysSince(date: Date, now = Date.now()) {
  return Math.floor((now - date.getTime()) / (24 * HOUR_MS));
}
