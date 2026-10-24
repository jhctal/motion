import {
  ArrowDownIcon,
  ArrowUpIcon,
  ClockIcon,
  FlameIcon,
  MoonIcon,
  SparklesIcon,
} from "lucide-react";
import { formatTime } from "../../utils/format-date";
import {
  SLEEP_QUALITIES,
  SLEEP_TARGET_MINUTES,
  addDays,
  averageClock,
  averageMinutes,
  clockDate,
  formatSleep,
  latestNightKey,
  loggedStreak,
  type Night,
} from "../../utils/sleep";
import { StatSkeleton, StatValue, WidgetCard } from "../widgets/widget-card";
import { QUALITY_STYLES } from "./quality";

// Nights in the window ending at the latest night, newest first
function lastNights(nights: Map<string, Night>, endKey: string, count: number) {
  return Array.from({ length: count }, (_, i) =>
    nights.get(addDays(endKey, -i)),
  ).filter((n): n is Night => !!n);
}

export function SleepStats({
  nights,
  isLoading,
}: {
  nights: Map<string, Night>;
  isLoading: boolean;
}) {
  const end = latestNightKey(nights);
  const week = lastNights(nights, end, 7);

  const average = averageMinutes(nights, end, 7);
  const previous = averageMinutes(nights, addDays(end, -7), 7);
  const change = average !== null && previous !== null ? average - previous : 0;

  const bed = averageClock(week.map((n) => n.bedTime));
  const wake = averageClock(
    week.map((n) => n.wakeTime),
    0,
  );

  const streak = loggedStreak(nights);
  const onTarget = week.filter((n) => n.minutes >= SLEEP_TARGET_MINUTES).length;

  const counts = SLEEP_QUALITIES.map(
    (q) => [q, week.filter((n) => n.quality === q).length] as const,
  );
  // ties go to the better rating
  const topQuality = [...counts]
    .reverse()
    .reduce((a, b) => (b[1] > a[1] ? b : a));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <WidgetCard title="Average sleep" icon={MoonIcon}>
        {isLoading ? (
          <StatSkeleton />
        ) : (
          <StatValue
            value={average === null ? "–" : formatSleep(average)}
            detail={
              average === null ? (
                "No nights logged this week"
              ) : change ? (
                <span className="inline-flex items-center gap-1">
                  <span
                    className={
                      change > 0
                        ? "inline-flex items-center text-green-600 dark:text-green-400"
                        : "inline-flex items-center text-red-600 dark:text-red-400"
                    }
                  >
                    {change > 0 ? (
                      <ArrowUpIcon size={12} aria-hidden="true" />
                    ) : (
                      <ArrowDownIcon size={12} aria-hidden="true" />
                    )}
                    {formatSleep(Math.abs(change))}
                  </span>
                  vs the 7 nights before
                </span>
              ) : (
                "Last 7 nights"
              )
            }
          />
        )}
      </WidgetCard>

      <WidgetCard title="Schedule" icon={ClockIcon}>
        {isLoading ? (
          <StatSkeleton />
        ) : (
          <StatValue
            value={bed === null ? "–" : formatTime(clockDate(bed))}
            detail={
              wake === null
                ? "Average bedtime"
                : `Average bedtime · up around ${formatTime(clockDate(wake))}`
            }
          />
        )}
      </WidgetCard>

      <WidgetCard title="Logging streak" icon={FlameIcon}>
        {isLoading ? (
          <StatSkeleton />
        ) : (
          <StatValue
            value={streak}
            unit={streak === 1 ? "night" : "nights"}
            detail={`${onTarget} of the last 7 nights hit ${formatSleep(SLEEP_TARGET_MINUTES)}`}
          />
        )}
      </WidgetCard>

      <WidgetCard title="Quality" icon={SparklesIcon}>
        {isLoading ? (
          <StatSkeleton />
        ) : !week.length ? (
          <StatValue value="–" detail="Rate your nights to see a trend" />
        ) : (
          <div className="mt-auto flex flex-col gap-2">
            <p className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {QUALITY_STYLES[topQuality[0]].label}
            </p>
            {/* this week's nights split by rating */}
            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
              {counts.map(
                ([q, n]) =>
                  n > 0 && (
                    <div
                      key={q}
                      className={QUALITY_STYLES[q].bar}
                      style={{ flexGrow: n }}
                      title={`${QUALITY_STYLES[q].label}: ${n}`}
                    />
                  ),
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Most common rating, last 7 nights
            </p>
          </div>
        )}
      </WidgetCard>
    </div>
  );
}
