import { useId, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import type { WorkoutSession } from "../../api/logged-workouts/use-list-logs";
import useMonthLogs from "../../api/logged-workouts/use-month-logs";
import Modal from "../modal";
import Button from "../button/button";
import { Skeleton } from "../widgets/widget-card";
import cn from "../../utils/cn";
import {
  formatCompact,
  formatDate,
  formatDuration,
} from "../../utils/format-date";
import { SessionCard } from "./session-card";
import { sessionDate, statusOf, toDayKey } from "./session-info";

// Small chips shown in a day before "+n more"
const MAX_CHIPS = 2;

type Cell = { date: Date; inMonth: boolean };

// Whole weeks covering the month, starting on Monday
function monthCells(year: number, month: number): Cell[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay() is Sunday-based; shift so weeks start on Monday
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = Math.ceil((lead + daysInMonth) / 7) * 7;
  return Array.from({ length: total }, (_, i) => {
    const date = new Date(year, month, i - lead + 1);
    return { date, inMonth: date.getMonth() === month };
  });
}

// Mon..Sun in the user's locale; any Monday-based week works
const WEEKDAYS = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i));

export function LogsCalendar({
  onDelete,
}: {
  onDelete: (session: WorkoutSession) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));
  const [openDay, setOpenDay] = useState<string | null>(null);

  const { year, month } = cursor;
  const { data, isLoading, isPlaceholderData } = useMonthLogs(year, month);

  const byDay = new Map<string, WorkoutSession[]>();
  for (const session of data ?? []) {
    const d = sessionDate(session);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    const key = toDayKey(d);
    byDay.set(key, [...(byDay.get(key) ?? []), session]);
  }
  // oldest first within a day, the order they happened
  for (const list of byDay.values()) {
    list.sort((a, b) => sessionDate(a).getTime() - sessionDate(b).getTime());
  }

  const monthSessions = [...byDay.values()].flat();
  const completed = monthSessions.filter((s) => s.status === "completed");
  const minutes = completed.reduce((sum, s) => sum + (s.duration || 0), 0);
  const volume = completed.reduce((sum, s) => sum + (s.totalWeight || 0), 0);
  const summary = [
    `${monthSessions.length} ${monthSessions.length === 1 ? "workout" : "workouts"}`,
    `${byDay.size} active ${byDay.size === 1 ? "day" : "days"}`,
    minutes > 0 ? formatDuration(minutes) : null,
    volume > 0 ? `${formatCompact(volume)} kg` : null,
  ].filter(Boolean);

  const shift = (by: number) => {
    const d = new Date(year, month + by, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };
  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();
  const todayKey = toDayKey(today);

  return (
    // laid out by its own width so it suits the page with or without sidebar
    <div className="@container flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatDate(new Date(year, month, 1), {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {isLoading ? "Loading…" : summary.join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={isCurrentMonth}
            onClick={() =>
              setCursor({ year: today.getFullYear(), month: today.getMonth() })
            }
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Previous month"
            className="px-2"
            onClick={() => shift(-1)}
          >
            <ChevronLeftIcon size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Next month"
            className="px-2"
            onClick={() => shift(1)}
          >
            <ChevronRightIcon size={16} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-[28rem] rounded-xl" />
      ) : (
        <div
          className={cn(
            "grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 shadow-sm transition-opacity dark:border-zinc-800 dark:bg-zinc-800",
            isPlaceholderData && "opacity-60",
          )}
        >
          {WEEKDAYS.map((d) => (
            <div
              key={d.getDay()}
              className="py-2 text-center text-[11px] font-medium uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-zinc-900 dark:text-gray-400"
            >
              <span className="@3xl:hidden">
                {formatDate(d, { weekday: "narrow" })}
              </span>
              <span className="hidden @3xl:inline">
                {formatDate(d, { weekday: "short" })}
              </span>
            </div>
          ))}

          {monthCells(year, month).map(({ date, inMonth }) => {
            const key = toDayKey(date);
            const sessions = inMonth ? (byDay.get(key) ?? []) : [];
            return (
              <DayCell
                key={key}
                date={date}
                inMonth={inMonth}
                isToday={key === todayKey}
                sessions={sessions}
                onOpen={() => setOpenDay(key)}
              />
            );
          })}
        </div>
      )}

      <DayModal
        dayKey={openDay}
        sessions={openDay ? (byDay.get(openDay) ?? []) : []}
        onClose={() => setOpenDay(null)}
        onDelete={onDelete}
      />
    </div>
  );
}

function DayCell({
  date,
  inMonth,
  isToday,
  sessions,
  onOpen,
}: {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  sessions: WorkoutSession[];
  onOpen: () => void;
}) {
  const hasSessions = sessions.length > 0;
  const extra = sessions.length - MAX_CHIPS;

  const content = (
    <>
      <span
        className={cn(
          "size-6 grid place-items-center rounded-full text-xs font-medium tabular-nums",
          !inMonth && "text-gray-300 dark:text-zinc-600",
          inMonth && !isToday && "text-gray-700 dark:text-gray-300",
          isToday && "bg-orange-500 text-white",
        )}
      >
        {date.getDate()}
      </span>

      {hasSessions && (
        <>
          {/* narrow: a dot per workout */}
          <span className="flex flex-wrap justify-center gap-0.5 @3xl:hidden">
            {sessions.slice(0, 3).map((s) => (
              <span
                key={s._id}
                className={cn("size-1.5 rounded-full", statusOf(s.status).dot)}
              />
            ))}
          </span>

          {/* wide: small cards */}
          <span className="hidden @3xl:flex w-full flex-col gap-1">
            {sessions.slice(0, MAX_CHIPS).map((s) => (
              <SessionChip key={s._id} session={s} />
            ))}
            {extra > 0 && (
              <span className="px-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                +{extra} more
              </span>
            )}
          </span>
        </>
      )}
    </>
  );

  const className = cn(
    "min-h-16 @3xl:min-h-28 flex flex-col items-center @3xl:items-start gap-1 p-1.5 text-left",
    inMonth ? "bg-white dark:bg-zinc-900" : "bg-gray-50/80 dark:bg-zinc-900/60",
  );

  if (!hasSessions) return <div className={className}>{content}</div>;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${formatDate(date, { weekday: "long", day: "numeric", month: "long" })}, ${sessions.length} ${sessions.length === 1 ? "workout" : "workouts"}`}
      className={cn(
        className,
        "cursor-pointer outline-none transition-colors hover:bg-orange-50/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 dark:hover:bg-zinc-800/80",
      )}
    >
      {content}
    </button>
  );
}

function SessionChip({ session }: { session: WorkoutSession }) {
  const status = statusOf(session.status);
  const detail = [
    session.status === "completed" && session.duration > 0
      ? formatDuration(session.duration)
      : status.label,
    session.totalWeight > 0 ? `${formatCompact(session.totalWeight)} kg` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <span
      className={cn(
        "w-full min-w-0 flex flex-col rounded-md border-l-[3px] bg-gray-50 px-1.5 py-1 dark:bg-zinc-800",
        status.accent,
      )}
    >
      <span className="truncate text-xs font-medium capitalize text-gray-900 dark:text-white">
        {session.name}
      </span>
      <span className="truncate text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
        {detail}
      </span>
    </span>
  );
}

function DayModal({
  dayKey,
  sessions,
  onClose,
  onDelete,
}: {
  dayKey: string | null;
  sessions: WorkoutSession[];
  onClose: () => void;
  onDelete: (session: WorkoutSession) => void;
}) {
  const titleId = useId();
  // closes itself once the last workout of the day is deleted
  const open = dayKey !== null && sessions.length > 0;
  const date = dayKey ? new Date(`${dayKey}T00:00`) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      className="max-w-xl max-h-[85dvh]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id={titleId}
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {date &&
              formatDate(date, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {sessions.length} {sessions.length === 1 ? "workout" : "workouts"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="size-8 grid place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <XIcon size={18} />
        </button>
      </div>
      <ul className="-mx-1 px-1 flex flex-col gap-2 overflow-y-auto overscroll-contain">
        {sessions.map((session) => (
          <li key={session._id}>
            <SessionCard session={session} onDelete={() => onDelete(session)} />
          </li>
        ))}
      </ul>
    </Modal>
  );
}
