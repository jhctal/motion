import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import useListLogs, {
  WorkoutSession,
} from "../../api/logged-workouts/use-list-logs";
import { useDeleteLog } from "../../api/logged-workouts/use-delete-log";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";
import cn from "../../utils/cn";

export const Route = createFileRoute("/my-logs/")({
  beforeLoad: async () => {
    const user = localStorage.getItem("user");
    if (!user) {
      throw redirect({ to: "/auth" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const goTo = useNavigate();
  const { data } = useListLogs();
  const remove = useDeleteLog();

  return (
    <PageWrapper pageName="Your Workouts">
      <div className="flex items-center justify-between mb-3 mt-2">
        <span className="text-sm text-gray-400 dark:text-gray-300">
          {data?.workoutSessions.length ?? 0} sessions
        </span>
        <button
          className="px-3 py-1 bg-orange-500 text-black text-sm font-medium rounded hover:bg-orange-400"
          onClick={() => goTo({ to: "/my-logs/new" })}
        >
          + Log workout
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {data?.workoutSessions.map((session) => (
          <SessionCard
            key={session._id}
            session={session}
            onDelete={() => {
              if (confirm(`Delete "${session.name}"?`)) {
                remove.mutate(session._id);
              }
            }}
            isDeleting={remove.isPending}
          />
        ))}
      </div>
    </PageWrapper>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({
  className,
  status,
}: {
  className?: string;
  status: string;
}) {
  const colours: Record<string, string> = {
    completed: "bg-green-600 text-white",
    "in-progress": "bg-orange-500 text-white",
    planned: "bg-gray-700 text-gray-300",
  };
  const cls = colours[status] ?? "bg-gray-700 text-gray-300";
  return (
    <span className={cn(`text-xs px-1.5 py-0.5 rounded ${cls}`, className)}>
      {status}
    </span>
  );
}
function MiniStatusBadge({
  className,
  status,
}: {
  className?: string;
  status: string;
}) {
  const colours: Record<string, string> = {
    completed: "bg-green-600 text-white",
    "in-progress": "bg-orange-500 text-white",
    planned: "bg-gray-700 text-gray-300",
  };
  const cls = colours[status] ?? "bg-gray-700 text-gray-300";
  return (
    <span
      className={cn(
        `text-xs p-1 size-6 text-center rounded-full ${cls}`,
        className,
      )}
    >
      {status.charAt(0)}
    </span>
  );
}

function SessionCard({
  session,
  onDelete,
  isDeleting,
}: {
  session: WorkoutSession;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="border rounded flex items-stretch">
      <Link
        to="/my-logs/$id"
        params={{ id: session._id }}
        className="flex-1 p-3 min-w-0"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-0.5">
          <span className="font-medium text-lg md:text-sm capitalize flex items-center gap-1">
            {session.name}
            <MiniStatusBadge
              className="block md:hidden"
              status={session.status}
            />
          </span>
          <StatusBadge className="hidden md:block" status={session.status} />
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-300 flex gap-3">
          <span>{formatDate(session.createdAt)}</span>
          {session.exercises.length > 0 && (
            <span className="hidden md:block">
              {session.exercises.length} exercises
            </span>
          )}
          {session.totalSets > 0 && (
            <span className="hidden md:block">{session.totalSets} sets</span>
          )}
        </div>
      </Link>

      {confirming ? (
        <div className="flex items-center gap-1.5 px-3 border-l shrink-0">
          <button
            onClick={() => setConfirming(false)}
            className="px-2 py-1.5 text-xs text-gray-400 dark:text-gray-300 border rounded-lg hover:bg-white/5"
          >
            No
          </button>
          <button
            onClick={() => {
              onDelete();
              setConfirming(false);
            }}
            disabled={isDeleting}
            className="px-2 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-40"
          >
            {isDeleting ? "…" : "Delete"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="px-5 py-4 border-l text-red-500 hover:bg-red-500 hover:text-white transition-colors text-lg sm:px-3 sm:py-0 sm:text-sm"
          aria-label="Delete log"
        >
          ✕
        </button>
      )}
    </div>
  );
}
