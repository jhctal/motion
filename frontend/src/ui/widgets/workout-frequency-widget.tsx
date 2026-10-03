import { useWorkoutSessions } from "../../api/workouts/use-workout-sessions";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function toDayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Intensity ramp for a day's cell: 0 sessions -> neutral, 1 -> orange-400, 2+ -> orange-600.
function cellClass(count: number) {
  if (count >= 2) return "bg-orange-600";
  if (count === 1) return "bg-orange-400";
  return "bg-gray-100 dark:bg-zinc-800";
}

export function WorkoutFrequencyWidget() {
  const { data, isLoading } = useWorkoutSessions({
    status: "completed",
    limit: 90,
    populate: "false",
    count: "false",
  });
  const sessions = data?.workoutSessions ?? [];

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startOfToday = new Date(year, month, now.getDate());

  const countsByDay = new Map<string, number>();
  for (const s of sessions) {
    const d = new Date(s.startedAt);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    const key = toDayKey(d);
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay() is Sunday-based (0-6); shift so the week starts on Monday.
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(year, month, i + 1),
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const activeDays = countsByDay.size;
  const monthLabel = now.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-gray-300 uppercase tracking-wide">
          Workout Frequency
        </p>
        <p className="text-xs text-gray-500">{monthLabel}</p>
      </div>
      <p className="text-xs text-gray-500">
        {activeDays} day{activeDays !== 1 ? "s" : ""} active
      </p>
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="flex items-start gap-4">
          <div className="flex gap-1 w-full">
            <div className="grid grid-rows-7 gap-1 justify-center items-center">
              {WEEKDAY_LABELS.map((label, i) => (
                <span
                  key={i}
                  className="w-3 h-3 text-[8px] leading-3 text-gray-500"
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="grid grid-rows-7 grid-flow-col gap-1">
              {cells.map((date, i) => {
                if (!date) return <div key={i} className="w-6 h-6" />;

                const key = toDayKey(date);
                const count = countsByDay.get(key) ?? 0;
                const isFuture = date.getTime() > startOfToday.getTime();
                const isToday = key === toDayKey(startOfToday);

                return (
                  <div
                    key={i}
                    title={
                      isFuture
                        ? undefined
                        : `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${count} workout${count !== 1 ? "s" : ""}`
                    }
                    className={`w-6 h-6 border rounded-sm text-xs flex justify-center items-center ${
                      isFuture
                        ? "border-dashed text-gray-300 dark:text-zinc-700"
                        : cellClass(count)
                    } ${isToday ? "ring-1 ring-inset ring-black/40 dark:ring-white/70" : ""}`}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
