import { useState } from "react";
import { ChartColumnIcon } from "lucide-react";
import cn from "../../utils/cn";
import { formatDate, formatTime } from "../../utils/format-date";
import {
  SLEEP_QUALITIES,
  SLEEP_TARGET_MINUTES,
  addDays,
  formatSleep,
  keyToDate,
  latestNightKey,
  type Night,
} from "../../utils/sleep";
import { SegmentedControl, Skeleton, WidgetCard } from "../widgets/widget-card";
import { QUALITY_STYLES } from "./quality";

const PERIODS = [
  { label: "1W", value: "7" },
  { label: "2W", value: "14" },
  { label: "1M", value: "30" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

// One bar per night, oldest on the left, coloured by quality, with a dashed
// line at the nightly target. Bars and labels are HTML in percentages.
export function SleepChart({
  nights,
  isLoading,
}: {
  nights: Map<string, Night>;
  isLoading: boolean;
}) {
  const [period, setPeriod] = useState<Period>("7");
  const [active, setActive] = useState<number | null>(null);

  const count = Number(period);
  const end = latestNightKey(nights);
  const days = Array.from({ length: count }, (_, i) => {
    const key = addDays(end, i - count + 1);
    return { key, night: nights.get(key) };
  });

  // whole even hours, always leaving room above the target line
  const longest = Math.max(
    SLEEP_TARGET_MINUTES,
    ...days.map((d) => d.night?.minutes ?? 0),
  );
  const maxHours = Math.ceil((longest + 30) / 120) * 2;
  const pct = (minutes: number) => (minutes / (maxHours * 60)) * 100;
  const ticks = Array.from(
    { length: maxHours / 4 + 1 },
    (_, i) => i * 4,
  ).filter((h) => h <= maxHours);

  const shown = active !== null ? days[active] : null;

  return (
    <WidgetCard
      title="Nightly sleep"
      icon={ChartColumnIcon}
      action={
        <SegmentedControl
          label="Chart period"
          options={PERIODS}
          value={period}
          onChange={(p) => {
            setPeriod(p);
            setActive(null);
          }}
        />
      }
    >
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            {/* Y axis labels */}
            <div className="relative w-7 shrink-0 text-right text-[10px] tabular-nums text-gray-400 dark:text-gray-500">
              {ticks.map((h) => (
                <span
                  key={h}
                  className="absolute right-0 translate-y-1/2"
                  style={{ bottom: `${pct(h * 60)}%` }}
                >
                  {h}h
                </span>
              ))}
            </div>

            <div
              className="relative h-48 flex-1"
              onPointerLeave={() => setActive(null)}
              aria-hidden="true"
            >
              {/* Gridlines */}
              {ticks.map((h) => (
                <div
                  key={h}
                  className="absolute inset-x-0 h-px bg-gray-100 dark:bg-zinc-800"
                  style={{ bottom: `${pct(h * 60)}%` }}
                />
              ))}

              {/* Target line */}
              <div
                className="absolute inset-x-0 border-t border-dashed border-orange-400/70"
                style={{ bottom: `${pct(SLEEP_TARGET_MINUTES)}%` }}
              >
                <span className="absolute right-0 -top-4 text-[10px] font-medium text-orange-500 dark:text-orange-400">
                  Target {formatSleep(SLEEP_TARGET_MINUTES)}
                </span>
              </div>

              {/* Bars */}
              <div
                className={cn(
                  "absolute inset-0 flex items-end",
                  count > 14 ? "gap-0.5" : "gap-1.5",
                )}
              >
                {days.map(({ key, night }, i) => (
                  <div
                    key={key}
                    className="relative h-full flex-1 flex items-end touch-none"
                    onPointerEnter={() => setActive(i)}
                    onPointerDown={() => setActive(i)}
                  >
                    {night ? (
                      <div
                        className={cn(
                          "w-full rounded-t-md origin-bottom transition-[scale,opacity] duration-500 ease-out starting:scale-y-0 motion-reduce:transition-none",
                          QUALITY_STYLES[night.quality].bar,
                          active !== null && active !== i && "opacity-50",
                        )}
                        style={{ height: `${pct(night.minutes)}%` }}
                      />
                    ) : (
                      // missing night: a stub so the gap reads as "not logged"
                      <div className="w-full h-1 rounded-full bg-gray-100 dark:bg-zinc-800" />
                    )}
                  </div>
                ))}
              </div>

              {/* Tooltip */}
              {shown && active !== null && (
                <div
                  className="absolute top-0 z-10 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 py-1 text-xs shadow-md dark:border-zinc-700 dark:bg-zinc-800"
                  style={{
                    left: `${((active + 0.5) / count) * 100}%`,
                    // keep the box inside the plot near the edges
                    transform: `translateX(${active > count * 0.75 ? "-100%" : active < count * 0.25 ? "0" : "-50%"})`,
                  }}
                >
                  <p className="text-gray-500 dark:text-gray-400">
                    {formatDate(keyToDate(shown.key), {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  {shown.night ? (
                    <>
                      <p className="font-semibold tabular-nums text-gray-900 dark:text-white">
                        {formatSleep(shown.night.minutes)} ·{" "}
                        {QUALITY_STYLES[shown.night.quality].label}
                      </p>
                      <p className="tabular-nums text-gray-500 dark:text-gray-400">
                        {formatTime(shown.night.bedTime)} –{" "}
                        {formatTime(shown.night.wakeTime)}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-900 dark:text-white">Not logged</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* X axis */}
          <div className="flex pl-9 text-[10px] text-gray-400 dark:text-gray-500">
            {days.map(({ key }, i) => {
              const date = keyToDate(key);
              // short day names on 1W, initials on 2W; on 1M only every
              // 5th date, plus the last
              const label =
                count <= 7
                  ? formatDate(date, { weekday: "short" })
                  : count <= 14
                    ? formatDate(date, { weekday: "narrow" })
                    : i % 5 === 0 || i === count - 1
                      ? formatDate(date, { day: "numeric" })
                      : "";
              return (
                <span key={key} className="flex-1 text-center">
                  {label}
                </span>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 pl-9 text-xs text-gray-500 dark:text-gray-400">
            {SLEEP_QUALITIES.map((q) => (
              <span key={q} className="inline-flex items-center gap-1.5">
                <span
                  className={cn("size-2.5 rounded-sm", QUALITY_STYLES[q].bar)}
                />
                {QUALITY_STYLES[q].label}
              </span>
            ))}
          </div>

          {/* Same data for screen readers. sr-only goes on a wrapper: tables
              ignore overflow, so on the <table> itself the rows still take up
              space and stretch the page. */}
          <div className="sr-only">
            <table>
              <caption>Sleep per night</caption>
              <thead>
                <tr>
                  <th scope="col">Night</th>
                  <th scope="col">Sleep</th>
                  <th scope="col">Quality</th>
                </tr>
              </thead>
              <tbody>
                {days.map(({ key, night }) => (
                  <tr key={key}>
                    <td>{formatDate(keyToDate(key))}</td>
                    <td>{night ? formatSleep(night.minutes) : "Not logged"}</td>
                    <td>{night ? QUALITY_STYLES[night.quality].label : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
