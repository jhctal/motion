// Reads backup files produced by export-logs.ts back into session objects
// in the same shape as the API, ready for POST /api/workout-sessions/import

type ImportedSet = Record<string, string | number | boolean | undefined>;

export type ImportedSession = {
  _id?: string;
  name: string;
  status?: string;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: string;
  rating?: string;
  feeling?: string;
  exercises: {
    exercise: { name: string; category?: string; mainTargetMuscle?: string };
    sets: ImportedSet[];
  }[];
};

// RFC 4180-ish: quoted fields, escaped quotes, CRLF or LF line endings
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell !== ""));
}

// Undo the formula guard added on export
function unguard(value: string) {
  return /^'[=+\-@]/.test(value) ? value.slice(1) : value;
}

const REQUIRED_COLUMNS = ["session_name", "date", "exercise", "set_number"];

export function csvToSessions(text: string): ImportedSession[] {
  const [header, ...rows] = parseCsv(text.replace(/^﻿/, ""));
  if (!header || REQUIRED_COLUMNS.some((col) => !header.includes(col))) {
    throw new Error("This CSV doesn't look like a workout export");
  }

  const sessions = new Map<string, ImportedSession>();

  for (const cells of rows) {
    const r = Object.fromEntries(
      header.map((col, i) => [col, unguard(cells[i] ?? "")]),
    );
    const key = r.session_id || `${r.session_name}|${r.date}`;

    let session = sessions.get(key);
    if (!session) {
      session = {
        _id: r.session_id || undefined,
        name: r.session_name,
        status: r.status || undefined,
        createdAt: r.started_at || r.date,
        startedAt: r.started_at || undefined,
        completedAt: r.completed_at || undefined,
        duration: r.duration_minutes || undefined,
        rating: r.rating || undefined,
        feeling: r.feeling || undefined,
        exercises: [],
      };
      sessions.set(key, session);
    }

    if (!r.exercise) continue;

    // consecutive rows for the same exercise belong to one exercise block
    let exercise = session.exercises[session.exercises.length - 1];
    if (!exercise || exercise.exercise.name !== r.exercise || !r.set_number) {
      exercise = {
        exercise: {
          name: r.exercise,
          category: r.category || undefined,
          mainTargetMuscle: r.target_muscle || undefined,
        },
        sets: [],
      };
      session.exercises.push(exercise);
    }

    if (r.set_number) {
      exercise.sets.push({
        setNumber: r.set_number,
        reps: r.reps,
        weight: r.weight,
        durationInSeconds: r.duration_seconds,
        distance: r.distance,
        rpe: r.rpe || undefined,
        restTime: r.rest_seconds,
        completed: r.completed === "true",
        notes: r.set_notes || undefined,
      });
    }
  }

  return [...sessions.values()];
}

// Accepts an array of sessions, the list endpoint's { workoutSessions } shape,
// or a single session
export function jsonToSessions(text: string): ImportedSession[] {
  const data = JSON.parse(text);
  const sessions = Array.isArray(data)
    ? data
    : Array.isArray(data?.workoutSessions)
      ? data.workoutSessions
      : data && typeof data === "object" && "name" in data
        ? [data]
        : null;
  if (!sessions) throw new Error("This JSON doesn't look like a workout export");
  return sessions;
}

export async function readBackupFile(file: File): Promise<ImportedSession[]> {
  const text = await file.text();
  return file.name.toLowerCase().endsWith(".csv")
    ? csvToSessions(text)
    : jsonToSessions(text);
}
