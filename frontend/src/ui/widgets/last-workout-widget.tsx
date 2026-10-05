import { Link } from "@tanstack/react-router";
import { useWorkoutSessions } from "../../api/workouts/use-workout-sessions";

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function timeAgo(date: string) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function LastWorkoutWidget() {
  const { data, isLoading } = useWorkoutSessions({
    status: "completed",
    limit: 1,
    count: "false",
  });
  const session = data?.workoutSessions?.[0];

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3 h-full">
      <p className="text-xs text-gray-400 dark:text-gray-300 uppercase tracking-wide">
        Last Workout
      </p>
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : !session ? (
        <p className="text-sm text-gray-500">No workouts logged yet</p>
      ) : (
        <>
          <div>
            <p className="font-semibold capitalize text-lg leading-tight">
              {session.name}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">
              {timeAgo(session.completedAt)}
            </p>
          </div>
          <div className="flex gap-6 text-sm mt-1">
            <div>
              <p className="text-gray-400 dark:text-gray-300 text-xs">
                Duration
              </p>
              <p className="font-medium">{formatDuration(session.duration)}</p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-300 text-xs">Volume</p>
              <p className="font-medium">
                {session.totalWeight.toLocaleString()} kg
              </p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-300 text-xs">
                Exercises
              </p>
              <p className="font-medium">{session.exercises.length}</p>
            </div>
          </div>
          <Link
            to="/my-logs/$id"
            params={{ id: session._id }}
            className="text-xs text-orange-400 hover:text-orange-300 mt-auto"
          >
            View session →
          </Link>
        </>
      )}
    </div>
  );
}
