import { useId, useState } from "react";
import { MoonIcon, PencilIcon } from "lucide-react";
import {
  useCreateSleepLog,
  useUpdateSleepLog,
  type SleepLog,
} from "../../api/sleep/use-sleep-logs";
import cn from "../../utils/cn";
import { getErrorMessage } from "../../utils/api-error";
import {
  SLEEP_QUALITIES,
  SLEEP_TARGET_MINUTES,
  buildSleepTimes,
  formatSleep,
  lastNightKey,
  localDateKey,
  nightKey,
  timeInputValue,
  type SleepQuality,
} from "../../utils/sleep";
import { FormError } from "../auth-layout";
import Button from "../button/button";
import Input from "../form/input";
import Textarea from "../form/textarea";
import Modal from "../modal";
import { QUALITY_STYLES } from "./quality";

// A fresh form for a new night, or the log's values when editing
const initialForm = (log?: SleepLog) =>
  log
    ? {
        night: nightKey(log),
        bed: timeInputValue(log.bedTime),
        wake: timeInputValue(log.wakeTime),
        quality: log.quality,
        notes: log.notes ?? "",
      }
    : {
        night: lastNightKey(),
        bed: "23:00",
        wake: "07:00",
        quality: "good" as SleepQuality,
        notes: "",
      };

// Logs a new night, or edits `log` when given. The caller keys this by the
// log's id so the form starts from the right values each time.
export function LogSleepModal({
  open,
  onClose,
  log,
}: {
  open: boolean;
  onClose: () => void;
  log?: SleepLog;
}) {
  const titleId = useId();
  const createLog = useCreateSleepLog();
  const updateLog = useUpdateSleepLog();
  const save = log ? updateLog : createLog;
  const [form, setForm] = useState(() => initialForm(log));

  const times =
    form.night && form.bed && form.wake
      ? buildSleepTimes(form.night, form.bed, form.wake)
      : null;
  const minutes = times
    ? Math.round((times.wakeTime.getTime() - times.bedTime.getTime()) / 60_000)
    : null;

  const close = () => {
    save.reset();
    setForm(initialForm(log));
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!times) return;
    const data = {
      date: form.night,
      bedTime: times.bedTime.toISOString(),
      wakeTime: times.wakeTime.toISOString(),
      quality: form.quality,
    };
    if (log) {
      // send empty notes as "" so clearing them actually removes them
      updateLog.mutate(
        { id: log._id, ...data, notes: form.notes.trim() },
        { onSuccess: close },
      );
    } else {
      createLog.mutate(
        { ...data, notes: form.notes.trim() || undefined },
        { onSuccess: close },
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      labelledBy={titleId}
      className="max-w-md"
    >
      <div className="flex items-center gap-3">
        <span className="size-10 shrink-0 grid place-items-center rounded-full bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400">
          {log ? (
            <PencilIcon size={18} aria-hidden="true" />
          ) : (
            <MoonIcon size={18} aria-hidden="true" />
          )}
        </span>
        <h2
          id={titleId}
          className="text-base font-semibold text-gray-900 dark:text-white"
        >
          {log ? "Edit sleep" : "Log sleep"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-4" disabled={save.isPending}>
          <Input
            label="Night of"
            type="date"
            value={form.night}
            max={localDateKey(new Date())}
            onChange={(e) => setForm((f) => ({ ...f, night: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Went to bed"
              type="time"
              value={form.bed}
              onChange={(e) => setForm((f) => ({ ...f, bed: e.target.value }))}
              required
            />
            <Input
              label="Woke up"
              type="time"
              value={form.wake}
              onChange={(e) => setForm((f) => ({ ...f, wake: e.target.value }))}
              required
            />
          </div>

          {/* live duration, with progress towards the target */}
          {minutes !== null && (
            <div
              className="flex flex-col gap-2 rounded-lg bg-orange-50 px-4 py-3 dark:bg-orange-500/10"
              aria-live="polite"
            >
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                  {formatSleep(minutes)}
                </span>{" "}
                of sleep
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-orange-100 dark:bg-orange-500/20">
                <div
                  className="h-full rounded-full bg-orange-500 transition-[width] duration-300"
                  style={{
                    width: `${Math.min(minutes / SLEEP_TARGET_MINUTES, 1) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div
            role="radiogroup"
            aria-label="How did you sleep?"
            className="flex flex-col gap-1.5"
          >
            <span className="text-sm font-medium">How did you sleep?</span>
            <div className="grid grid-cols-4 gap-2">
              {SLEEP_QUALITIES.map((q) => {
                const { label, icon: Icon } = QUALITY_STYLES[q];
                const selected = form.quality === q;
                return (
                  <button
                    key={q}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setForm((f) => ({ ...f, quality: q }))}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border px-1 py-2.5 text-xs font-medium transition-colors cursor-pointer",
                      selected
                        ? "border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400"
                        : "border-gray-200 text-gray-500 hover:border-orange-300 dark:border-zinc-700 dark:text-gray-400",
                    )}
                  >
                    <Icon size={20} aria-hidden="true" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <Textarea
            label="Notes (optional)"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="e.g. restless, vivid dreams"
          />
        </fieldset>

        <FormError
          message={save.error ? getErrorMessage(save.error) : undefined}
        />

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={close}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={save.isPending || !times}
          >
            {save.isPending ? "Saving…" : log ? "Save changes" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
