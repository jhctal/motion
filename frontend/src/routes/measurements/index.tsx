import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";
import {
  useBodyMeasurements,
  useCreateBodyMeasurement,
  useDeleteBodyMeasurement,
  useUpdateBodyMeasurement,
  useMeasurementTrends,
  type MeasurementType,
  type TrendDataPoint,
  type BodyMeasurement,
} from "../../api/body-measurements/use-body-measurements";

export const Route = createFileRoute("/measurements/")({
  beforeLoad: async ({ location }) => {
    const user = localStorage.getItem("user");
    if (!user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
  },
  component: RouteComponent,
});

type NonWeightMeasurementType = Exclude<MeasurementType, "weight">;

const MEASUREMENT_TYPES: { type: NonWeightMeasurementType; label: string }[] = [
  { type: "body-fat", label: "Body Fat" },
  { type: "muscle-mass", label: "Muscle Mass" },
  { type: "chest", label: "Chest" },
  { type: "waist", label: "Waist" },
  { type: "hips", label: "Hips" },
  { type: "bicep", label: "Bicep" },
  { type: "thigh", label: "Thigh" },
  { type: "neck", label: "Neck" },
  { type: "forearm", label: "Forearm" },
  { type: "calf", label: "Calf" },
];

const UNITS_FOR: Record<NonWeightMeasurementType, string[]> = {
  "body-fat": ["percent"],
  "muscle-mass": ["lbs", "kg"],
  chest: ["inches", "cm"],
  waist: ["inches", "cm"],
  hips: ["inches", "cm"],
  bicep: ["inches", "cm"],
  thigh: ["inches", "cm"],
  neck: ["inches", "cm"],
  forearm: ["inches", "cm"],
  calf: ["inches", "cm"],
};

const DEFAULT_UNIT: Record<NonWeightMeasurementType, string> = {
  "body-fat": "percent",
  "muscle-mass": "lbs",
  chest: "inches",
  waist: "inches",
  hips: "inches",
  bicep: "inches",
  thigh: "inches",
  neck: "inches",
  forearm: "inches",
  calf: "inches",
};

const PERIODS = ["1m", "3m", "6m", "1y"] as const;
type Period = (typeof PERIODS)[number];

export function RouteComponent() {
  const [activeType, setActiveType] =
    useState<NonWeightMeasurementType>("waist");

  return (
    <PageWrapper pageName="Measurements">
      <div className="flex flex-col gap-4 mt-4 max-w-2xl">
        {/* Type tabs */}
        <div className="flex flex-wrap gap-1">
          {MEASUREMENT_TYPES.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                activeType === type
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <MeasurementPanel key={activeType} measurementType={activeType} />
      </div>
    </PageWrapper>
  );
}

function MeasurementPanel({
  measurementType,
}: {
  measurementType: NonWeightMeasurementType;
}) {
  const today = new Date().toISOString().split("T")[0];
  const label = MEASUREMENT_TYPES.find(
    (m) => m.type === measurementType,
  )!.label;
  const units = UNITS_FOR[measurementType];

  const [form, setForm] = useState({
    value: "",
    unit: DEFAULT_UNIT[measurementType],
    measuredDate: today,
    notes: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [period, setPeriod] = useState<Period>("3m");

  const { data: entries, isLoading } = useBodyMeasurements({
    measurementType,
    limit: 50,
  });
  const { data: trends } = useMeasurementTrends(measurementType, period);
  const createEntry = useCreateBodyMeasurement();
  const deleteEntry = useDeleteBodyMeasurement();
  const updateEntry = useUpdateBodyMeasurement();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEntry.mutate(
      {
        measurementType,
        value: Number(form.value),
        unit: form.unit,
        measuredDate: form.measuredDate,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm({
            value: "",
            unit: DEFAULT_UNIT[measurementType],
            measuredDate: today,
            notes: "",
          });
        },
      },
    );
  };

  return (
    <>
      <button
        className="self-start px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => setShowForm((v) => !v)}
      >
        {showForm ? "Cancel" : `Log ${label}`}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 border p-4 rounded"
        >
          <div className="flex gap-2">
            <label className="flex flex-col gap-1 text-sm flex-1">
              {label}
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.value}
                onChange={(e) =>
                  setForm((f) => ({ ...f, value: e.target.value }))
                }
                className="border rounded p-1"
                placeholder="e.g. 32"
                required
              />
            </label>
            {units.length > 1 && (
              <label className="flex flex-col gap-1 text-sm w-24">
                Unit
                <select
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  className="border rounded p-1"
                >
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
            )}
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
              <span
                className={
                  Number(trends.summary.totalChange) < 0
                    ? "text-green-600"
                    : "text-red-500"
                }
              >
                {Number(trends.summary.totalChange) > 0 ? "+" : ""}
                {Number(trends.summary.totalChange).toFixed(1)} total
              </span>
            </div>
            <div className="flex gap-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2 py-0.5 text-xs rounded ${
                    period === p
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <MeasurementChart
            data={trends.data}
            measurementType={measurementType}
          />
        </div>
      )}

      {/* Entry list */}
      {isLoading && <div>Loading...</div>}
      {!isLoading && entries?.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-300">
          No {label.toLowerCase()} entries yet.
        </p>
      )}
      <div className="flex flex-col gap-2">
        {entries?.map((entry) => (
          <MeasurementEntry
            key={entry._id}
            entry={entry}
            label={label}
            units={units}
            onDelete={() => deleteEntry.mutate(entry._id)}
            onUpdate={(data) => updateEntry.mutate({ id: entry._id, data })}
          />
        ))}
      </div>
    </>
  );
}

function MeasurementChart({
  data,
  measurementType,
}: {
  data: TrendDataPoint[];
  measurementType: NonWeightMeasurementType;
}) {
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

  const gradientId = `measurement-fill-${measurementType}`;
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
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#${gradientId})`} points={area} />
      <polyline
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinejoin="round"
        points={polyline}
      />
      {data.map((d, i) => (
        <circle key={i} cx={toX(d)} cy={toY(d)} r="3" fill="#3b82f6" />
      ))}
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

function MeasurementEntry({
  entry,
  label,
  units,
  onDelete,
  onUpdate,
}: {
  entry: BodyMeasurement;
  label: string;
  units: string[];
  onDelete: () => void;
  onUpdate: (data: Partial<BodyMeasurement>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    value: String(entry.value),
    unit: entry.unit,
    measuredDate: entry.measuredDate.split("T")[0],
    notes: entry.notes ?? "",
  });

  const date = new Date(entry.measuredDate).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      value: Number(form.value),
      unit: form.unit,
      measuredDate: form.measuredDate,
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
            {label}
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
          {units.length > 1 && (
            <label className="flex flex-col gap-1 text-sm w-24">
              Unit
              <select
                value={form.unit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unit: e.target.value }))
                }
                className="border rounded p-1"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
          )}
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
          <span
            className={`text-sm ${entry.change < 0 ? "text-green-600" : "text-red-500"}`}
          >
            {entry.change > 0 ? "+" : ""}
            {entry.change.toFixed(1)}
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
