import { useBodyMeasurements } from "../../api/body-measurements/use-body-measurements";

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 200;
  const H = 48;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-12"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="#f97316"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
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
  const values = sorted.map((m) => m.value);

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-2">
      <p className="text-xs text-gray-400 dark:text-gray-300 uppercase tracking-wide">
        Weight
      </p>
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : !latest ? (
        <p className="text-sm text-gray-500">No weight data yet</p>
      ) : (
        <>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{latest.value}</span>
            <span className="text-gray-400 dark:text-gray-300 mb-0.5">
              {latest.unit}
            </span>
            {!!latest.change && (
              <span
                className={`text-sm mb-0.5 ${latest.change < 0 ? "text-green-400" : "text-red-400"}`}
              >
                {latest.change > 0 ? "+" : ""}
                {latest.change.toFixed(1)}
              </span>
            )}
          </div>
          <Sparkline values={values} />
          <p className="text-xs text-gray-500">Last 30 entries</p>
        </>
      )}
    </div>
  );
}
