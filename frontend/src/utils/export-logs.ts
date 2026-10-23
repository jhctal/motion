// Loose shape so both WorkoutSession types (list + detail) can be exported
type ExportSet = {
  setNumber: number;
  reps?: number;
  weight?: number;
  durationInSeconds?: number;
  duration?: number;
  distance?: number;
  rpe?: number;
  restTime?: number;
  completed?: boolean;
  notes?: string;
};

type ExportSession = {
  _id: string;
  name: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  duration?: number;
  rating?: number;
  feeling?: string;
  exercises: {
    exercise: string | { name: string; category?: string; mainTargetMuscle?: string };
    sets: ExportSet[];
  }[];
};

const CSV_HEADERS = [
  "session_id",
  "session_name",
  "status",
  "date",
  "started_at",
  "completed_at",
  "duration_minutes",
  "rating",
  "feeling",
  "exercise",
  "category",
  "target_muscle",
  "set_number",
  "reps",
  "weight",
  "duration_seconds",
  "distance",
  "rpe",
  "rest_seconds",
  "completed",
  "set_notes",
];

function escapeCsv(value: unknown): string {
  if (value === undefined || value === null) return "";
  let str = String(value);
  // stop spreadsheet apps treating user text as a formula
  if (typeof value === "string" && /^[=+\-@]/.test(str)) str = `'${str}`;
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// One row per set; sessions/exercises with no sets still get a row
export function sessionsToCsv(sessions: ExportSession[]): string {
  const rows: unknown[][] = [];

  for (const session of sessions) {
    const sessionCols = [
      session._id,
      session.name,
      session.status,
      session.createdAt.slice(0, 10),
      session.startedAt ?? "",
      session.completedAt ?? "",
      session.duration ?? "",
      session.rating ?? "",
      session.feeling ?? "",
    ];

    if (session.exercises.length === 0) {
      rows.push(sessionCols);
      continue;
    }

    for (const ex of session.exercises) {
      const exercise =
        typeof ex.exercise === "string" ? { name: ex.exercise } : ex.exercise;
      const exerciseCols = [
        exercise.name,
        exercise.category ?? "",
        exercise.mainTargetMuscle ?? "",
      ];

      if (ex.sets.length === 0) {
        rows.push([...sessionCols, ...exerciseCols]);
        continue;
      }

      for (const set of ex.sets) {
        rows.push([
          ...sessionCols,
          ...exerciseCols,
          set.setNumber,
          set.reps,
          set.weight,
          set.durationInSeconds ?? set.duration,
          set.distance,
          set.rpe,
          set.restTime,
          set.completed,
          set.notes,
        ]);
      }
    }
  }

  return [CSV_HEADERS, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");
}

export function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9_]+/g, "-").replace(/^-|-$/g, "");
}

export function exportSessions(
  sessions: ExportSession[],
  format: "json" | "csv",
  baseName: string,
) {
  const filename = `${slugify(baseName) || "workouts"}.${format}`;
  if (format === "json") {
    downloadFile(filename, JSON.stringify(sessions, null, 2), "application/json");
  } else {
    downloadFile(filename, sessionsToCsv(sessions), "text/csv;charset=utf-8");
  }
}
