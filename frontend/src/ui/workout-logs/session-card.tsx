import { Link } from "@tanstack/react-router";
import { ChevronRightIcon, Trash2Icon } from "lucide-react";
import type { WorkoutSession } from "../../api/logged-workouts/use-list-logs";
import MuscleTag from "../muscle-tag";
import cn from "../../utils/cn";
import { formatDate, formatSessionTitle } from "../../utils/format-date";
import { sessionMuscles, sessionStats, statusOf } from "./session-info";

type CardProps = {
  session: WorkoutSession;
  onDelete: () => void;
};

const MAX_MUSCLES = 4;

function Muscles({ session }: { session: WorkoutSession }) {
  const muscles = sessionMuscles(session);
  if (muscles.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {muscles.slice(0, MAX_MUSCLES).map((m) => (
        <MuscleTag key={m} muscle={m} />
      ))}
      {muscles.length > MAX_MUSCLES && (
        <span className="text-xs text-gray-400">
          +{muscles.length - MAX_MUSCLES}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = statusOf(status);
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        s.badge,
      )}
    >
      {s.label}
    </span>
  );
}

function DeleteButton({
  session,
  onDelete,
  className,
}: CardProps & { className?: string }) {
  return (
    <button
      type="button"
      onClick={onDelete}
      aria-label={`Delete ${formatSessionTitle(session)}`}
      className={cn(
        "shrink-0 size-9 grid place-items-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-red-500/10 dark:hover:text-red-400",
        className,
      )}
    >
      <Trash2Icon size={16} />
    </button>
  );
}

const cardClassName =
  "group rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-orange-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-orange-500/50";

// Full-width row, used by the list view and the calendar's day modal
export function SessionCard({ session, onDelete }: CardProps) {
  const status = statusOf(session.status);
  const StatusIcon = status.icon;
  const stats = sessionStats(session);

  return (
    <div className={cn(cardClassName, "flex items-stretch")}>
      <Link
        to="/my-logs/$id"
        params={{ id: session._id }}
        className="flex-1 min-w-0 flex gap-4 p-4"
      >
        <span
          className={cn(
            "size-10 shrink-0 grid place-items-center rounded-lg",
            status.tile,
          )}
        >
          <StatusIcon size={20} aria-hidden="true" />
        </span>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
            <h3 className="min-w-0 truncate font-semibold capitalize text-gray-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
              {formatSessionTitle(session)}
            </h3>
            <StatusBadge status={session.status} />
          </div>

          <Muscles session={session} />

          {stats.length > 0 && (
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              {stats.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="inline-flex items-center gap-1 tabular-nums"
                >
                  <Icon size={12} aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          )}
        </div>

        <ChevronRightIcon
          size={18}
          aria-hidden="true"
          className="hidden sm:block self-center shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-500 dark:text-zinc-600"
        />
      </Link>

      <DeleteButton
        session={session}
        onDelete={onDelete}
        className="self-start m-2"
      />
    </div>
  );
}

// Compact tile for the grid view: name and date on top, muscles in the
// middle, stats in a footer that lines up across a row of tiles
export function SessionTile({ session, onDelete }: CardProps) {
  const status = statusOf(session.status);
  const StatusIcon = status.icon;
  const stats = sessionStats(session);

  return (
    <div className={cn(cardClassName, "relative h-full")}>
      <Link
        to="/my-logs/$id"
        params={{ id: session._id }}
        className="h-full flex flex-col gap-3 p-4"
      >
        <div className="flex items-start gap-3 pr-8">
          <span
            className={cn(
              "size-9 shrink-0 grid place-items-center rounded-lg",
              status.tile,
            )}
          >
            <StatusIcon size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex flex-col">
            <h3 className="truncate font-semibold capitalize text-gray-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
              {session.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(session.createdAt, {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-start gap-2">
          <StatusBadge status={session.status} />
          <Muscles session={session} />
        </div>

        {stats.length > 0 && (
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 border-t border-gray-100 text-xs text-gray-500 dark:border-zinc-800 dark:text-gray-400">
            {stats.map(({ label, icon: Icon, text }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1 tabular-nums"
              >
                <Icon size={12} aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        )}
      </Link>

      <DeleteButton
        session={session}
        onDelete={onDelete}
        className="absolute top-2 right-2"
      />
    </div>
  );
}
