// Rough workout length from the planned exercises. Template targets are used
// when present; otherwise these typical gym values fill the gaps.
export const ESTIMATE_DEFAULTS = {
  sets: 3,
  workSeconds: 45, // time under load per set
  restSeconds: 90, // between sets
  changeoverSeconds: 60, // moving to and setting up the next exercise
  cardioMinutes: 20,
};

export type EstimateExercise = {
  category?: string;
  // Exercise.duration in minutes; only trusted for cardio
  durationMinutes?: number;
  targetSets?: number;
  restSeconds?: number;
  // Template targetDurationSeconds, for timed sets like planks
  workSeconds?: number;
};

const positive = (n: number | undefined) =>
  n !== undefined && n > 0 ? n : undefined;

export function estimateExerciseSeconds(ex: EstimateExercise) {
  const d = ESTIMATE_DEFAULTS;

  if (ex.category === "cardio") {
    const minutes = positive(ex.durationMinutes) ?? d.cardioMinutes;
    return minutes * 60 + d.changeoverSeconds;
  }

  const sets = positive(ex.targetSets) ?? d.sets;
  const work = positive(ex.workSeconds) ?? d.workSeconds;
  const rest =
    ex.restSeconds !== undefined && ex.restSeconds >= 0
      ? ex.restSeconds
      : d.restSeconds;

  // no rest after the last set; the changeover covers moving on
  return sets * work + (sets - 1) * rest + d.changeoverSeconds;
}

export function estimateWorkout(exercises: EstimateExercise[]) {
  if (exercises.length === 0) return { minutes: 0, sets: 0 };

  const seconds = exercises.reduce(
    (total, ex) => total + estimateExerciseSeconds(ex),
    0,
  );
  const sets = exercises.reduce(
    (total, ex) =>
      ex.category === "cardio"
        ? total
        : total + (positive(ex.targetSets) ?? ESTIMATE_DEFAULTS.sets),
    0,
  );

  // it's an estimate, so round to the nearest 5 minutes
  return { minutes: Math.max(5, Math.round(seconds / 60 / 5) * 5), sets };
}
