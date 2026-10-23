import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, HistoryIcon } from "lucide-react";
import { useWorkoutSessions } from "../../api/workouts/use-workout-sessions";
import {
  formatCompact,
  formatDuration,
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
  exercises: { exercise: string | { mainTargetMuscle?: string } }[];
};

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
