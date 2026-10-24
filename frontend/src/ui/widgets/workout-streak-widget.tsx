import { FlameIcon } from "lucide-react";
import { useWorkoutSessions } from "../../api/workouts/use-workout-sessions";
import cn from "../../utils/cn";
import { formatDate } from "../../utils/format-date";
import { StatSkeleton, StatValue, WidgetCard } from "./widget-card";

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

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

// Which days of the current Monday-start week had a workout
function thisWeek(sessions: { startedAt: string }[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const trained = new Set(
    sessions.map((s) => new Date(s.startedAt).toDateString()),
  );
  return WEEKDAYS.map((label, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return {
      label,
      date: day,
      trained: trained.has(day.toDateString()),
      isToday: day.getTime() === today.getTime(),
      isFuture: day > today,
    };
  });
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
  const week = thisWeek(sessions);

  return (
    <WidgetCard title="Streak" icon={FlameIcon}>
      {isLoading ? (
        <StatSkeleton />
      ) : (
        <div className="mt-auto flex items-end justify-between gap-4">
          <StatValue
            value={streak}
            unit={streak === 1 ? "workout" : "workouts"}
            detail={
              streak > 0
                ? `No more than ${GAP_THRESHOLD_DAYS} days between sessions`
                : "Log a workout to start a streak"
            }
          />
          {/* This week at a glance */}
          <ol className="flex gap-1 shrink-0" aria-label="This week">
            {week.map((day, i) => (
              <li key={i} className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "size-4 rounded-full",
                    day.trained
                      ? "bg-orange-500"
                      : day.isFuture
                        ? "border border-dashed border-gray-300 dark:border-zinc-700"
                        : "bg-gray-100 dark:bg-zinc-800",
                    day.isToday &&
                      "ring-2 ring-orange-500/40 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900",
                  )}
                  title={`${formatDate(day.date, { weekday: "long" })}: ${day.trained ? "trained" : "rest"}`}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "text-[10px] text-gray-400 dark:text-gray-500",
                    day.isToday &&
                      "font-semibold text-gray-700 dark:text-gray-200",
                  )}
                >
                  {day.label}
                </span>
                <span className="sr-only">
                  {formatDate(day.date, { weekday: "long" })}:{" "}
                  {day.trained ? "trained" : "no workout"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </WidgetCard>
  );
}
