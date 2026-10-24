import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, HistoryIcon } from "lucide-react";
import { useWorkoutSessions } from "../../api/workouts/use-workout-sessions";
import {
  formatCompact,
  formatDuration,
  formatNumber,
  formatRelativeDay,
  formatSessionTitle,
} from "../../utils/format-date";
import MuscleTag from "../muscle-tag";
import { Skeleton, WidgetCard } from "./widget-card";

type LastSession = {
  _id: string;
  name: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  duration: number;
  totalWeight: number;
  exercises: {
    _id?: string;
    exercise: string | { name?: string; mainTargetMuscle?: string };
    sets?: { weight?: number; reps?: number; completed?: boolean }[];
  }[];
};

// Exercises shown in the breakdown (biggest share first) before "+N more"
const MAX_EXERCISES = 3;

// Per exercise: completed sets, the heaviest completed set (more reps wins
// a tie) and its volume, for the breakdown list
function summariseExercises(session: LastSession) {
  return session.exercises.map((ex, i) => {
    const done = (ex.sets ?? []).filter((set) => set.completed);
    const best = done.reduce<(typeof done)[number] | undefined>(
      (top, set) =>
        !top ||
        (set.weight ?? 0) > (top.weight ?? 0) ||
        ((set.weight ?? 0) === (top.weight ?? 0) &&
          (set.reps ?? 0) > (top.reps ?? 0))
          ? set
          : top,
      undefined,
    );
    return {
      key: ex._id ?? String(i),
      name:
        typeof ex.exercise === "object" && ex.exercise.name
          ? ex.exercise.name
          : "Exercise",
      sets: done.length,
      best,
      volume: done.reduce(
        (sum, set) => sum + (set.weight ?? 0) * (set.reps ?? 0),
        0,
      ),
    };
  });
}

// "60 kg × 8", or just "12 reps" for bodyweight
function formatBestSet(set?: { weight?: number; reps?: number }) {
  if (!set) return "–";
  const reps = set.reps ?? 0;
  return set.weight
    ? `${formatNumber(set.weight)} kg × ${reps}`
    : `${reps} reps`;
}

export function LastWorkoutWidget() {
  const { data, isLoading } = useWorkoutSessions({
    status: "completed",
    limit: 1,
    count: "false",
  });
  const session: LastSession | undefined = data?.workoutSessions?.[0];

  const muscles = [
    ...new Set(
      (session?.exercises ?? [])
        .map((ex) =>
          typeof ex.exercise === "object" ? ex.exercise.mainTargetMuscle : "",
        )
        .filter((m): m is string => !!m),
    ),
  ];
  const exercises = session ? summariseExercises(session) : [];
  // bars show each exercise's share of the volume; bodyweight-only
  // sessions have none, so fall back to share of sets
  const totalVolume = exercises.reduce((sum, ex) => sum + ex.volume, 0);
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const share = (ex: (typeof exercises)[number]) =>
    totalVolume ? ex.volume / totalVolume : totalSets ? ex.sets / totalSets : 0;
  const topExercises = [...exercises]
    .sort((a, b) => share(b) - share(a))
    .slice(0, MAX_EXERCISES);
  const stats = session && [
    { label: "Duration", value: formatDuration(session.duration) },
    { label: "Volume", value: `${formatCompact(session.totalWeight)} kg` },
    { label: "Exercises", value: String(session.exercises.length) },
  ];

  return (
    <WidgetCard title="Last workout" icon={HistoryIcon}>
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : !session || !stats ? (
        <div className="flex-1 flex flex-col items-start justify-center gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No workouts logged yet
          </p>
          <Link
            to="/my-logs/new"
            className="text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
          >
            Log your first workout →
          </Link>
        </div>
      ) : (
        <>
          <div className="min-w-0">
            <p className="font-semibold capitalize leading-snug text-gray-900 dark:text-white truncate">
              {formatSessionTitle(session)}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 first-letter:uppercase">
              {formatRelativeDay(
                session.startedAt ?? session.completedAt ?? session.createdAt,
              )}
            </p>
          </div>

          <dl className="grid grid-cols-3 divide-x divide-gray-200 rounded-lg bg-gray-50 py-2 dark:divide-zinc-800 dark:bg-zinc-800/50">
            {stats.map((stat) => (
              <div key={stat.label} className="px-3">
                <dt className="text-[11px] text-gray-500 dark:text-gray-400">
                  {stat.label}
                </dt>
                <dd className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>

          {exercises.length > 0 && (
            <div className="flex flex-col gap-2">
              <ul className="flex flex-col gap-2.5">
                {topExercises.map((ex) => {
                  const percent = Math.round(share(ex) * 100);
                  return (
                    <li key={ex.key} className="flex flex-col gap-1">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium text-gray-800 dark:text-gray-200">
                          {ex.name}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">
                          {ex.sets} {ex.sets === 1 ? "set" : "sets"} · best{" "}
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {formatBestSet(ex.best)}
                          </span>
                        </span>
                      </div>
                      {/* share of the session's volume (or sets) */}
                      <div className="flex items-center gap-2">
                        <div
                          aria-hidden="true"
                          className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800"
                        >
                          <div
                            className="h-full rounded-full bg-orange-500/80"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-8 shrink-0 text-right text-[11px] font-medium tabular-nums text-gray-500 dark:text-gray-400">
                          {percent}%
                          <span className="sr-only">
                            {totalVolume ? " of volume" : " of sets"}
                          </span>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {exercises.length > MAX_EXERCISES && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  +{exercises.length - MAX_EXERCISES} more{" "}
                  {exercises.length - MAX_EXERCISES === 1
                    ? "exercise"
                    : "exercises"}
                </p>
              )}
            </div>
          )}

          {muscles.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {muscles.map((m) => (
                <MuscleTag key={m} muscle={m} />
              ))}
            </div>
          )}

          <Link
            to="/my-logs/$id"
            params={{ id: session._id }}
            className="mt-auto inline-flex items-center gap-1 self-start text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
          >
            View workout
            <ArrowRightIcon size={14} aria-hidden="true" />
          </Link>
        </>
      )}
    </WidgetCard>
  );
}
