import { useState } from "react";
import Button from "../button/button";
import Modal from "../modal";
import TabButton from "../tab-button";
import fetchAllLogs from "../../api/logged-workouts/fetch-all-logs";
import { exportSessions } from "../../utils/export-logs";

type Format = "json" | "csv";
type Preset = "all" | "30d" | "90d" | "year" | "custom";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom" },
];

// YYYY-MM-DD in the user's timezone, as used by <input type="date">
function toDateInput(d: Date) {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function presetRange(preset: Preset): { from: string; to: string } {
  const today = new Date();
  const from = new Date(today);
  if (preset === "30d") from.setDate(today.getDate() - 29);
  else if (preset === "90d") from.setDate(today.getDate() - 89);
  else if (preset === "year") from.setMonth(0, 1);
  else return { from: "", to: "" };
  return { from: toDateInput(from), to: toDateInput(today) };
}

type ExportLogsModalProps = {
  open: boolean;
  onClose: () => void;
};

const ExportLogsModal = ({ open, onClose }: ExportLogsModalProps) => {
  const [preset, setPreset] = useState<Preset>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [format, setFormat] = useState<Format>("csv");
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const today = toDateInput(new Date());
  const isRange = preset !== "all";
  const rangeError =
    isRange && (!from || !to)
      ? "Pick a start and end date"
      : isRange && from > to
        ? "Start date must be before end date"
        : null;

  function selectPreset(value: Preset) {
    setPreset(value);
    setMessage(null);
    if (value !== "custom") {
      const range = presetRange(value);
      setFrom(range.from);
      setTo(range.to);
    }
  }

  async function handleDownload() {
    setExporting(true);
    setMessage(null);
    try {
      const sessions = await fetchAllLogs(
        isRange
          ? {
              // whole days in the user's timezone
              startDate: new Date(`${from}T00:00:00`).toISOString(),
              endDate: new Date(`${to}T23:59:59.999`).toISOString(),
            }
          : undefined,
      );

      if (sessions.length === 0) {
        setMessage("No workouts in this range");
        return;
      }

      let name: string;
      if (isRange) {
        name = `workouts_${from}_${to}`;
      } else {
        const dates = sessions
          .map((s) => toDateInput(new Date(s.createdAt)))
          .sort();
        name = `workouts_${dates[0]}_${dates[dates.length - 1]}`;
      }

      exportSessions(sessions, format, name);
      onClose();
    } catch {
      setMessage("Failed to export workouts");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Export workouts
      </h2>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-300">Range</span>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((p) => (
            <TabButton
              key={p.value}
              active={preset === p.value}
              onClick={() => selectPreset(p.value)}
              className="text-sm px-2.5 py-1"
            >
              {p.label}
            </TabButton>
          ))}
        </div>
      </div>

      {isRange && (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            From
            <input
              type="date"
              value={from}
              max={to || today}
              onChange={(e) => {
                setFrom(e.target.value);
                setPreset("custom");
                setMessage(null);
              }}
              className="border rounded px-2 py-1.5 bg-transparent dark:scheme-dark"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            To
            <input
              type="date"
              value={to}
              min={from || undefined}
              max={today}
              onChange={(e) => {
                setTo(e.target.value);
                setPreset("custom");
                setMessage(null);
              }}
              className="border rounded px-2 py-1.5 bg-transparent dark:[color-scheme:dark]"
            />
          </label>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-300">Format</span>
        <div className="flex gap-1">
          {(["csv", "json"] as const).map((f) => (
            <TabButton
              key={f}
              active={format === f}
              onClick={() => setFormat(f)}
              className="text-sm px-2.5 py-1"
            >
              {f.toUpperCase()}
            </TabButton>
          ))}
        </div>
      </div>

      {(rangeError || message) && (
        <p className="text-sm text-red-500">{rangeError ?? message}</p>
      )}

      <div className="flex gap-3 mt-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          disabled={exporting || !!rangeError}
          onClick={handleDownload}
        >
          {exporting ? "Exporting..." : "Download"}
        </Button>
      </div>
    </Modal>
  );
};

export default ExportLogsModal;
