// Validates one workout session from an uploaded backup file and returns a
// clean copy, or throws with a message describing what's wrong.
// Exercises are left unresolved ({ id, name, category, mainTargetMuscle }).

const STATUSES = ["planned", "in-progress", "completed", "skipped"];
const FEELINGS = ["terrible", "bad", "okay", "good", "amazing"];
export const CATEGORIES = ["strength", "cardio", "flexibility", "balance", "sports"];

const MAX_EXERCISES = 100;
const MAX_SETS = 200;
const MAX_TEXT = 2000;

function text(value, max = MAX_TEXT) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function number(value, { min = 0, max = 1e6 } = {}) {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  return n < min || n > max ? undefined : n;
}

function date(value) {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function normaliseSet(raw, index) {
  if (!raw || typeof raw !== "object") throw new Error(`Set ${index + 1} is invalid`);
  return {
    setNumber: number(raw.setNumber, { min: 1, max: MAX_SETS }) ?? index + 1,
    reps: number(raw.reps) ?? 0,
    weight: number(raw.weight) ?? 0,
    durationInSeconds: number(raw.durationInSeconds ?? raw.duration) ?? 0,
    distance: number(raw.distance) ?? 0,
    rpe: number(raw.rpe, { min: 1, max: 10 }),
    restTime: number(raw.restTime) ?? 0,
    completed: raw.completed === true || raw.completed === "true",
    notes: text(raw.notes),
  };
}

function normaliseExercise(raw, index) {
  if (!raw || typeof raw !== "object") throw new Error(`Exercise ${index + 1} is invalid`);

  const ex = raw.exercise;
  const ref =
    typeof ex === "string"
      ? { id: ex }
      : ex && typeof ex === "object"
        ? {
            id: typeof ex._id === "string" ? ex._id : undefined,
            name: text(ex.name, 200),
            category: CATEGORIES.includes(ex.category) ? ex.category : undefined,
            mainTargetMuscle: text(ex.mainTargetMuscle, 100),
          }
        : null;
  if (!ref || (!ref.id && !ref.name)) {
    throw new Error(`Exercise ${index + 1} has no id or name`);
  }

  const sets = Array.isArray(raw.sets) ? raw.sets : [];
  if (sets.length > MAX_SETS) throw new Error(`Exercise ${index + 1} has too many sets`);

  return { ref, sets: sets.map(normaliseSet), notes: text(raw.notes) };
}

export function normaliseImportedSession(raw) {
  if (!raw || typeof raw !== "object") throw new Error("Session is not an object");

  const name = text(raw.name, 200);
  if (!name) throw new Error("Session has no name");

  const exercises = Array.isArray(raw.exercises) ? raw.exercises : [];
  if (exercises.length > MAX_EXERCISES) throw new Error("Session has too many exercises");

  const createdAt = date(raw.createdAt) ?? date(raw.startedAt);
  if (!createdAt) throw new Error("Session has no valid date");

  const rating = number(raw.rating, { min: 1, max: 5 });

  return {
    // the id of the original session, used for duplicate detection
    originalIds: [raw._id, raw.importedFrom].filter(
      (id) => typeof id === "string" && id.length <= 100,
    ),
    name,
    status: STATUSES.includes(raw.status) ? raw.status : "completed",
    createdAt,
    startedAt: date(raw.startedAt) ?? createdAt,
    completedAt: date(raw.completedAt),
    duration: number(raw.duration) ?? 0,
    rating: rating === undefined ? undefined : Math.round(rating),
    feeling: FEELINGS.includes(raw.feeling) ? raw.feeling : undefined,
    notes: text(raw.notes),
    location: text(raw.location, 200),
    tags: Array.isArray(raw.tags)
      ? raw.tags.map((t) => text(t, 50)).filter(Boolean).slice(0, 20)
      : [],
    exercises: exercises.map(normaliseExercise),
  };
}
