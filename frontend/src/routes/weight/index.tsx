import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";
import {
  useBodyMeasurements,
  useCreateBodyMeasurement,
  useDeleteBodyMeasurement,
  useUpdateBodyMeasurement,
  useMeasurementTrends,
  type TrendDataPoint,
  type BodyMeasurement,
} from "../../api/body-measurements/use-body-measurements";
import Button from "../../ui/button/button";

export const Route = createFileRoute("/weight/")({
  component: RouteComponent,
});

const PERIODS = ["1m", "3m", "6m", "1y"] as const;
type Period = (typeof PERIODS)[number];

export function RouteComponent() {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    value: "",
    unit: "lbs",
    measuredDate: today,
    timeOfDay: "",
    conditions: "",
    notes: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [period, setPeriod] = useState<Period>("3m");

  const { data: entries, isLoading } = useBodyMeasurements({
    measurementType: "weight",
    limit: 50,
  });
  const { data: trends } = useMeasurementTrends("weight", period);
  const createEntry = useCreateBodyMeasurement();
  const deleteEntry = useDeleteBodyMeasurement();
  const updateEntry = useUpdateBodyMeasurement();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEntry.mutate(
      {
        measurementType: "weight",
        value: Number(form.value),
        unit: form.unit,
        measuredDate: form.measuredDate,
        timeOfDay: form.timeOfDay || undefined,
        conditions: form.conditions || undefined,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm({
            value: "",
            unit: "lbs",
            measuredDate: today,
            timeOfDay: "",
            conditions: "",
            notes: "",
          });
        },
      },
    );
  };

  return (
    <PageWrapper pageName="Weight">
      <div className="flex flex-col gap-4 mt-4 max-w-2xl">
        <Button className="w-fit" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Log Weight"}
        </Button>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 border p-4 rounded"
          >
            <div className="flex gap-2">
              <label className="flex flex-col gap-1 text-sm flex-1">
                Weight
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.value}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, value: e.target.value }))
                  }
                  className="border rounded p-1"
                  placeholder="e.g. 180"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm w-24">
                Unit
                <select
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  className="border rounded p-1"
                >
                  <option value="lbs">lbs</option>
                  <option value="kg">kg</option>
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              Date
              <input
                type="date"
                value={form.measuredDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, measuredDate: e.target.value }))
                }
                className="border rounded p-1"
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-sm">
                Time of day (optional)
                <select
                  value={form.timeOfDay}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, timeOfDay: e.target.value }))
                  }
                  className="border rounded p-1"
                >
                  <option value="">— none —</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Conditions (optional)
                <input
                  type="text"
                  value={form.conditions}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, conditions: e.target.value }))
                  }
                  className="border rounded p-1"
                  placeholder="e.g. fasted"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              Notes (optional)
              <input
                type="text"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                className="border rounded p-1"
              />
            </label>
            <button
              type="submit"
              disabled={createEntry.isPending}
              className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
            >
              {createEntry.isPending ? "Saving..." : "Save"}
            </button>
          </form>
        )}

        {/* Chart */}
        {trends && trends.data.length >= 2 && (
          <div className="border rounded p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-3 text-sm text-gray-500">
                <span>
                  Latest:{" "}
                  <span className="font-semibold text-gray-800">
                    {trends.summary.latest} {entries?.[0]?.unit ?? ""}
                  </span>
                </span>
                <span className="text-green-600">
                  {Number(trends.summary.totalChange) > 0 ? "+" : ""}
                  {Number(trends.summary.totalChange).toFixed(1)} total
                </span>
              </div>
              <div className="flex gap-1">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-2 py-0.5 text-xs rounded ${period === p ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <WeightChart data={trends.data} />
          </div>
        )}

        {/* Entry list */}
        {isLoading && <div>Loading...</div>}
        <div className="flex flex-col gap-2">
          {entries?.map((entry) => (
            <WeightEntry
              key={entry._id}
              entry={entry}
              onDelete={() => deleteEntry.mutate(entry._id)}
              onUpdate={(data) => updateEntry.mutate({ id: entry._id, data })}
            />
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}

function WeightChart({ data }: { data: TrendDataPoint[] }) {
  const W = 560;
  const H = 160;
  const padX = 44;
  const padY = 16;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valRange = maxVal - minVal || 1;

  const times = data.map((d) => new Date(d.date).getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeRange = maxTime - minTime || 1;

  const toX = (d: TrendDataPoint) =>
    padX + ((new Date(d.date).getTime() - minTime) / timeRange) * chartW;
  const toY = (d: TrendDataPoint) =>
    padY + (1 - (d.value - minVal) / valRange) * chartH;

  const polyline = data.map((d) => `${toX(d)},${toY(d)}`).join(" ");
  const area = [
    `${toX(data[0])},${padY + chartH}`,
    ...data.map((d) => `${toX(d)},${toY(d)}`),
    `${toX(data[data.length - 1])},${padY + chartH}`,
  ].join(" ");

  const startDate = new Date(data[0].date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const endDate = new Date(data[data.length - 1].date).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric" },
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="weight-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <polygon fill="url(#weight-fill)" points={area} />

      {/* Line */}
      <polyline
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinejoin="round"
        points={polyline}
      />

      {/* Dots */}
      {data.map((d, i) => (
        <circle key={i} cx={toX(d)} cy={toY(d)} r="3" fill="#3b82f6" />
      ))}

      {/* Y axis labels */}
      <text
        x={padX - 6}
        y={padY + 4}
        textAnchor="end"
        fontSize={10}
        fill="#9ca3af"
      >
        {maxVal.toFixed(1)}
      </text>
      <text
        x={padX - 6}
        y={padY + chartH}
        textAnchor="end"
        fontSize={10}
        fill="#9ca3af"
      >
        {minVal.toFixed(1)}
      </text>

      {/* X axis labels */}
      <text x={padX} y={H - 2} textAnchor="start" fontSize={10} fill="#9ca3af">
        {startDate}
      </text>
      <text
        x={W - padX}
        y={H - 2}
        textAnchor="end"
        fontSize={10}
        fill="#9ca3af"
      >
        {endDate}
      </text>
    </svg>
  );
}

function WeightEntry({
  entry,
  onDelete,
  onUpdate,
}: {
  entry: BodyMeasurement;
  onDelete: () => void;
  onUpdate: (data: Partial<BodyMeasurement>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    value: String(entry.value),
    unit: entry.unit,
    measuredDate: entry.measuredDate.split("T")[0],
    timeOfDay: entry.timeOfDay ?? "",
    conditions: entry.conditions ?? "",
    notes: entry.notes ?? "",
  });

  const date = new Date(entry.measuredDate).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const changeColor =
    entry.change == null
      ? ""
      : entry.change < 0
        ? "text-green-600"
        : "text-red-500";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      value: Number(form.value),
      unit: form.unit,
      measuredDate: form.measuredDate,
      timeOfDay: form.timeOfDay || undefined,
      conditions: form.conditions || undefined,
      notes: form.notes || undefined,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="flex flex-col gap-2 border p-3 rounded"
      >
        <div className="flex gap-2">
          <label className="flex flex-col gap-1 text-sm flex-1">
            Weight
            <input
              type="number"
              min={0}
              step="0.1"
              value={form.value}
              onChange={(e) =>
                setForm((f) => ({ ...f, value: e.target.value }))
              }
              className="border rounded p-1"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm w-24">
            Unit
            <select
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              className="border rounded p-1"
            >
              <option value="lbs">lbs</option>
              <option value="kg">kg</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Date
            <input
              type="date"
              value={form.measuredDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, measuredDate: e.target.value }))
              }
              className="border rounded p-1"
              required
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-sm">
            Time of day
            <select
              value={form.timeOfDay}
              onChange={(e) =>
                setForm((f) => ({ ...f, timeOfDay: e.target.value }))
              }
              className="border rounded p-1"
            >
              <option value="">— none —</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Conditions
            <input
              type="text"
              value={form.conditions}
              onChange={(e) =>
                setForm((f) => ({ ...f, conditions: e.target.value }))
              }
              className="border rounded p-1"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Notes
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="border rounded p-1"
          />
        </label>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-3 py-1 text-sm border rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
          >
            Save
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between border p-3 rounded gap-4">
      <div className="flex gap-4 flex-wrap items-center">
        <span className="font-medium">{date}</span>
        <span>
          {entry.value} {entry.unit}
        </span>
        {entry.change != null && (
          <span className={`text-sm ${changeColor}`}>
            {entry.change > 0 ? "+" : ""}
            {entry.change.toFixed(1)}
          </span>
        )}
        {entry.timeOfDay && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 capitalize">
            {entry.timeOfDay}
          </span>
        )}
        {entry.conditions && (
          <span className="text-xs text-gray-400 dark:text-gray-300">
            {entry.conditions}
          </span>
        )}
        {entry.notes && (
          <span className="text-xs text-gray-400 dark:text-gray-300">
            {entry.notes}
          </span>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-blue-400 text-sm"
        >
          Edit
        </button>
        <button onClick={onDelete} className="text-red-400 text-sm">
          Delete
        </button>
      </div>
    </div>
  );
}
