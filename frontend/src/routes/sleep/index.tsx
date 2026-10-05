import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";
import {
  useSleepLogs,
  useCreateSleepLog,
  useDeleteSleepLog,
  SleepLog,
} from "../../api/sleep/use-sleep-logs";
import Button from "../../ui/button/button";

export const Route = createFileRoute("/sleep/")({
  component: RouteComponent,
});

const QUALITY_OPTIONS = ["poor", "fair", "good", "excellent"] as const;

function RouteComponent() {
  const { data: logs, isLoading } = useSleepLogs();
  const createLog = useCreateSleepLog();
  const deleteLog = useDeleteSleepLog();

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    date: today,
    bedTime: "",
    wakeTime: "",
    quality: "good" as SleepLog["quality"],
    notes: "",
  });

  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLog.mutate(
      {
        date: form.date,
        bedTime: new Date(`${form.date}T${form.bedTime}`).toISOString(),
        wakeTime: new Date(`${form.date}T${form.wakeTime}`).toISOString(),
        quality: form.quality,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm({
            date: today,
            bedTime: "",
            wakeTime: "",
            quality: "good",
            notes: "",
          });
        },
      },
    );
  };

  return (
    <PageWrapper pageName="Sleep">
      <div className="flex flex-col gap-4 mt-4">
        <Button className="w-fit" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Log Sleep"}
        </Button>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 border p-4 rounded max-w-md"
          >
            <label className="flex flex-col gap-1 text-sm">
              Date
              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                className="border rounded p-1"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Bed time
              <input
                type="time"
                value={form.bedTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bedTime: e.target.value }))
                }
                className="border rounded p-1"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Wake time
              <input
                type="time"
                value={form.wakeTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, wakeTime: e.target.value }))
                }
                className="border rounded p-1"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Quality
              <select
                value={form.quality}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    quality: e.target.value as SleepLog["quality"],
                  }))
                }
                className="border rounded p-1"
              >
                {QUALITY_OPTIONS.map((q) => (
                  <option key={q} value={q}>
                    {q.charAt(0).toUpperCase() + q.slice(1)}
                  </option>
                ))}
              </select>
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
                placeholder="e.g. restless, vivid dreams"
              />
            </label>
            <button
              type="submit"
              disabled={createLog.isPending}
              className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
            >
              {createLog.isPending ? "Saving..." : "Save"}
            </button>
          </form>
        )}

        {isLoading && <div>Loading...</div>}

        <div className="flex flex-col gap-2">
          {logs?.map((log) => (
            <SleepCard
              key={log._id}
              log={log}
              onDelete={() => deleteLog.mutate(log._id)}
            />
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}

function SleepCard({ log, onDelete }: { log: SleepLog; onDelete: () => void }) {
  const hours = Math.floor(log.durationMinutes / 60);
  const mins = log.durationMinutes % 60;

  return (
    <div className="flex items-center justify-between border p-3 rounded gap-4">
      <div className="flex gap-4">
        <div className="font-medium">
          {new Date(log.date).toLocaleDateString()}
        </div>
        <div>
          {hours}h {mins}m
        </div>
        <div className="capitalize">{log.quality}</div>
        {log.notes && <div className="text-gray-500 text-sm">{log.notes}</div>}
      </div>
      <button onClick={onDelete} className="text-red-400 text-sm">
        Delete
      </button>
    </div>
  );
}
