import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, ScaleIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useBodyMeasurements } from "../../api/body-measurements/use-body-measurements";
import { formatDate, formatNumber } from "../../utils/format-date";
import { Skeleton, WidgetCard } from "./widget-card";

// Plot drawn in a fixed viewBox and stretched to fit; the line uses a
// non-scaling stroke so it stays 2px. Dots, crosshair and labels are HTML
// positioned in percentages so they never stretch.
const W = 600;
const H = 160;

type Point = { date: Date; value: number };

function scale(points: Point[]) {
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // breathing room so the line never touches the top or bottom
  const pad = Math.max((max - min) * 0.15, 0.5);
  const lo = min - pad;
  const hi = max + pad;
  const xPct = (i: number) =>
    points.length === 1 ? 50 : (i / (points.length - 1)) * 100;
  const yPct = (v: number) => 100 - ((v - lo) / (hi - lo)) * 100;
  return { lo, hi, xPct, yPct };
}

function TrendChart({ points, unit }: { points: Point[]; unit: string }) {
  const [active, setActive] = useState<number | null>(null);
  const { lo, hi, xPct, yPct } = scale(points);

  const coords = points.map(
    (p, i) => [(xPct(i) / 100) * W, (yPct(p.value) / 100) * H] as const,
  );
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join("");
  const area = `${line}L${W},${H}L0,${H}Z`;

  const ticks = [hi, (hi + lo) / 2, lo];
  const last = points.length - 1;
  const shown = active ?? last;

  function handlePointer(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    setActive(Math.round(frac * last));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        {/* Y axis labels */}
        <div className="relative w-9 shrink-0 text-right text-[10px] tabular-nums text-gray-400 dark:text-gray-500">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${yPct(t)}%` }}
            >
              {formatNumber(t, { maximumFractionDigits: 1 })}
            </span>
          ))}
        </div>

        <div
          className="relative h-40 flex-1 touch-none cursor-crosshair"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setActive(null)}
          aria-hidden="true"
        >
          {/* Gridlines */}
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute inset-x-0 h-px bg-gray-100 dark:bg-zinc-800"
              style={{ top: `${yPct(t)}%` }}
            />
          ))}

          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
          >
            <path d={area} className="fill-orange-500" fillOpacity={0.1} />
            <path
              d={line}
              fill="none"
              className="stroke-orange-500"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Crosshair */}
          {active !== null && (
            <div
              className="absolute inset-y-0 w-px bg-gray-300 dark:bg-zinc-600"
              style={{ left: `${xPct(active)}%` }}
            />
          )}

          {/* Marker: hovered point, or the latest when idle */}
          <span
            className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-zinc-900"
            style={{
              left: `${xPct(shown)}%`,
              top: `${yPct(points[shown].value)}%`,
            }}
          />

          {/* Tooltip */}
          {active !== null && (
            <div
              className="absolute -top-1 z-10 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 py-1 text-xs shadow-md dark:border-zinc-700 dark:bg-zinc-800"
              style={{
                left: `${xPct(active)}%`,
                // keep the box inside the plot near the edges
                transform: `translate(${xPct(active) > 75 ? "-100%" : xPct(active) < 25 ? "0" : "-50%"}, -100%)`,
              }}
            >
              <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
                {formatNumber(points[active].value, {
                  maximumFractionDigits: 1,
                })}{" "}
                {unit}
              </span>{" "}
              <span className="text-gray-500 dark:text-gray-400">
                {formatDate(points[active].date)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* X axis: first and last dates */}
      <div className="flex justify-between pl-11 text-[10px] text-gray-400 dark:text-gray-500">
        <span>
          {formatDate(points[0].date, { day: "numeric", month: "short" })}
        </span>
        <span>
          {formatDate(points[last].date, { day: "numeric", month: "short" })}
        </span>
      </div>

      {/* Same data for screen readers. sr-only goes on a wrapper: tables
          ignore overflow, so on the <table> itself the rows still take up
          space and stretch the page. */}
      <div className="sr-only">
        <table>
          <caption>Weight entries</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Weight ({unit})</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.date.toISOString()}>
                <td>{formatDate(p.date)}</td>
                <td>{p.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function WeightTrendWidget() {
  const { data, isLoading } = useBodyMeasurements({
    measurementType: "weight",
    limit: 30,
  });

  const sorted = [...(data ?? [])].sort(
    (a, b) =>
      new Date(a.measuredDate).getTime() - new Date(b.measuredDate).getTime(),
  );
  const latest = sorted[sorted.length - 1];
  const points = sorted.map((m) => ({
    date: new Date(m.measuredDate),
    value: m.value,
  }));
  // change across the whole range shown, not just since the last entry
  const change = sorted.length > 1 ? latest.value - sorted[0].value : 0;

  return (
    <WidgetCard
      title="Weight"
      icon={ScaleIcon}
      action={
        sorted.length > 1 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Last {sorted.length} entries
          </span>
        )
      }
    >
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : !latest ? (
        <div className="flex flex-col items-start gap-2 py-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No weight entries yet
          </p>
          <Link
            to="/weight"
            className="text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
          >
            Log your weight →
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-semibold tracking-tight tabular-nums text-gray-900 dark:text-white">
              {formatNumber(latest.value, { maximumFractionDigits: 1 })}
              <span className="ml-1.5 text-base font-medium text-gray-400 dark:text-gray-500">
                {latest.unit}
              </span>
            </p>
            {change !== 0 && (
              // neutral colour: whether up or down is good depends on the goal
              <span className="inline-flex items-center gap-0.5 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium tabular-nums text-gray-700 dark:bg-zinc-800 dark:text-gray-300">
                {change > 0 ? (
                  <ArrowUpIcon size={12} aria-label="Up" />
                ) : (
                  <ArrowDownIcon size={12} aria-label="Down" />
                )}
                {formatNumber(Math.abs(change), { maximumFractionDigits: 1 })}{" "}
                {latest.unit} since{" "}
                {formatDate(sorted[0].measuredDate, {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>
          {points.length > 1 ? (
            <TrendChart points={points} unit={latest.unit} />
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Log another entry to see your trend.
            </p>
          )}
        </>
      )}
    </WidgetCard>
  );
}
