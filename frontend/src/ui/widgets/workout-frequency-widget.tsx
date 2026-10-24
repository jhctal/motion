import { useState } from "react";
import { CalendarDaysIcon } from "lucide-react";
import { useWorkoutSessions } from "../../api/workouts/use-workout-sessions";
import cn from "../../utils/cn";
import { formatDate } from "../../utils/format-date";
import { CountUp, Skeleton, WidgetCard } from "./widget-card";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function toDayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// One hue, light → dark for more sessions (dark mode: dim → bright).
// Day numbers use ink or white by the fill's luminance.
const STEPS = [
  {
    label: "No workouts",
    cell: "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400",
  },
  {
    label: "1 workout",
    cell: "bg-orange-200 text-orange-950 dark:bg-orange-800 dark:text-white",
  },
  {
    label: "2+ workouts",
    cell: "bg-orange-500 text-gray-950 dark:bg-orange-500 dark:text-gray-950",
  },
];

const stepFor = (count: number) => STEPS[Math.min(count, 2)];

type Cell = { date: Date; inMonth: boolean };

function monthCells(year: number, month: number): Cell[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay() is Sunday-based; shift so weeks start on Monday
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: Cell[] = Array.from({ length: lead + daysInMonth }, (_, i) => ({
    date: new Date(year, month, i - lead + 1),
    inMonth: i >= lead,
  }));
  const trail = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= trail; i++) {
    cells.push({ date: new Date(year, month + 1, i), inMonth: false });
  }
  return cells;
}

export function WorkoutFrequencyWidget() {
  const { data, isLoading } = useWorkoutSessions({
    status: "completed",
    limit: 90,
    populate: "false",
    count: "false",
  });
  const sessions: { startedAt: string }[] = data?.workoutSessions ?? [];
  const [hovered, setHovered] = useState<Date | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayKey = toDayKey(now);

  const counts = new Map<string, number>();
  const weekdayCounts = Array(7).fill(0) as number[];
  let sessionsThisMonth = 0;
  for (const s of sessions) {
    const d = new Date(s.startedAt);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    counts.set(toDayKey(d), (counts.get(toDayKey(d)) ?? 0) + 1);
    weekdayCounts[(d.getDay() + 6) % 7]++;
    sessionsThisMonth++;
  }

  const activeDays = counts.size;
  const busiest = Math.max(...weekdayCounts);
  const favouriteDay =
    busiest > 0
      ? formatDate(
          // any Monday-based date with the right weekday
          new Date(2024, 0, 1 + weekdayCounts.indexOf(busiest)),
          { weekday: "long" },
        )
      : "—";

  const describe = (date: Date) => {
    const count = counts.get(toDayKey(date)) ?? 0;
    return `${formatDate(date, { weekday: "short", day: "numeric", month: "short" })} · ${count} workout${count === 1 ? "" : "s"}`;
  };

  const summary = [
    { label: "Active days", value: activeDays },
    { label: "Sessions", value: sessionsThisMonth },
    { label: "Favourite day", value: favouriteDay },
  ];

  return (
    <WidgetCard
      title="Workout frequency"
      icon={CalendarDaysIcon}
      action={
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(now, { month: "long", year: "numeric" })}
        </span>
      }
    >
      {isLoading ? (
        <Skeleton className="h-56 w-full" />
      ) : (
        // laid out by the card's own width, not the screen's, so it works
        // in a narrow dashboard column as well as a wide one
        <div className="@container">
          <div className="flex flex-col @lg:flex-row gap-6">
            {/* stats above the calendar; beside it on the right when wide */}
            <dl className="flex-1 grid grid-cols-3 @lg:grid-cols-1 @lg:order-last content-start gap-3">
              {summary.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </dt>
                  <dd className="text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {typeof stat.value === "number" ? (
                      <CountUp value={stat.value} />
                    ) : (
                      stat.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="w-full @lg:max-w-72 flex flex-col gap-2">
              <div className="grid grid-cols-7 gap-0.5">
                {WEEKDAY_LABELS.map((label, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className="pb-1 text-center text-[10px] font-medium text-gray-400 dark:text-gray-500"
                  >
                    {label}
                  </span>
                ))}
                {monthCells(year, month).map(({ date, inMonth }, i) => {
                  if (!inMonth) return <span key={i} aria-hidden="true" />;

                  const key = toDayKey(date);
                  const isFuture = key > todayKey;
                  const isToday = key === todayKey;
                  return (
                    <div
                      key={i}
                      role="img"
                      tabIndex={isFuture ? -1 : 0}
                      aria-label={isFuture ? undefined : describe(date)}
                      onMouseEnter={() => !isFuture && setHovered(date)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(date)}
                      onBlur={() => setHovered(null)}
                      className={cn(
                        "aspect-square grid place-items-center rounded-sm text-[11px] font-medium tabular-nums outline-none transition-[filter]",
                        isFuture
                          ? "text-gray-300 dark:text-zinc-700"
                          : cn(
                              stepFor(counts.get(key) ?? 0).cell,
                              "hover:brightness-95 dark:hover:brightness-125 focus-visible:ring-2 focus-visible:ring-orange-500",
                            ),
                        isToday &&
                          "ring-2 ring-gray-900/70 ring-inset dark:ring-white/70",
                      )}
                    >
                      {date.getDate()}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                <span aria-live="polite" className="tabular-nums">
                  {hovered ? describe(hovered) : "Hover a day for details"}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  Less
                  {STEPS.map((step) => (
                    <span
                      key={step.label}
                      title={step.label}
                      className={cn("size-2.5 rounded-[3px]", step.cell)}
                    />
                  ))}
                  More
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
