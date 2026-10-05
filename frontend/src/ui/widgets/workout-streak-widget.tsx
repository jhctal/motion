import { useWorkoutSessions } from "../../api/workouts/use-workout-sessions";

// Max days allowed between workouts before the streak resets.
// Covers common plans like every-other-day (1 rest day) up to 2x/week (3 rest days).
const GAP_THRESHOLD_DAYS = 4;

function daysBetween(a: Date, b: Date) {
  return Math.round(Math.abs(a.getTime() - b.getTime()) / 86_400_000);
}

function computeStreak(sessions: { startedAt: string }[]) {
  if (sessions.length === 0) return 0;

  // One entry per calendar day, most recent first
  const seen = new Set<string>();
  const uniqueDays: Date[] = [];
  for (const s of sessions) {
    const d = new Date(s.startedAt);
    const key = d.toISOString().slice(0, 10);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueDays.push(d);
    }
  }
  uniqueDays.sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mostRecent = new Date(uniqueDays[0]);
  mostRecent.setHours(0, 0, 0, 0);
  if (daysBetween(today, mostRecent) > GAP_THRESHOLD_DAYS) return 0;

  let streak = 1;
  for (let i = 0; i < uniqueDays.length - 1; i++) {
    const curr = new Date(uniqueDays[i]);
    const next = new Date(uniqueDays[i + 1]);
    curr.setHours(0, 0, 0, 0);
    next.setHours(0, 0, 0, 0);
    if (daysBetween(curr, next) <= GAP_THRESHOLD_DAYS) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.5 1.5c.6 2.5-.4 4-1.7 5.4C9.3 8.2 8 9.7 8 12a4 4 0 004 4c1.7 0 2.5-1 2.8-1.8.3-.8.1-1.7-.3-2.2 1.6.7 2.5 2.3 2.5 4a5 5 0 01-5 5 6.5 6.5 0 01-6.5-6.5c0-2.6 1.2-4.3 2.6-5.9C9.6 6.7 11.3 4.8 12.5 1.5z" />
    </svg>
  );
}

export function WorkoutStreakWidget() {
  const { data, isLoading } = useWorkoutSessions({
    status: "completed",
    limit: 90,
    populate: "false",
    count: "false",
  });
  const sessions = data?.workoutSessions ?? [];
  const streak = computeStreak(sessions);

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3 h-full">
      <p className="text-xs text-gray-400 dark:text-gray-300 uppercase tracking-wide">
        Streak
      </p>
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="flex items-center gap-4">
          <FlameIcon className="w-10 h-auto text-orange-400 shrink-0" />
          <div>
            <p className="text-3xl font-bold leading-none">
              {streak}
              <span className="text-lg font-normal text-gray-400 dark:text-gray-300 ml-1">
                day{streak !== 1 ? "s" : ""}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {streak > 0 ? "Keep it going" : "Log a workout to start a streak"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
