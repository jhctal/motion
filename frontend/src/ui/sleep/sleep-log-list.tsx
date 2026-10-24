import { useState } from "react";
import {
  BedDoubleIcon,
  MoonIcon,
  PencilIcon,
  SunIcon,
  Trash2Icon,
} from "lucide-react";
import type { SleepLog } from "../../api/sleep/use-sleep-logs";
import cn from "../../utils/cn";
import { formatDate, formatTime } from "../../utils/format-date";
import {
  SLEEP_TARGET_MINUTES,
  formatSleep,
  keyToDate,
  nightKey,
  sleepMinutes,
} from "../../utils/sleep";
import ConfirmModal from "../modal/confirm-modal";
import { Skeleton, WidgetCard } from "../widgets/widget-card";
import { QUALITY_STYLES } from "./quality";

const iconButton =
  "size-9 shrink-0 grid place-items-center rounded-lg text-gray-400 transition-colors cursor-pointer";

function SleepLogRow({
  log,
  onEdit,
  onDelete,
}: {
  log: SleepLog;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const night = keyToDate(nightKey(log));
  const minutes = sleepMinutes(log);
  const quality = QUALITY_STYLES[log.quality];
  const QualityIcon = quality.icon;

  return (
    <li className="flex items-center gap-4 py-3">
      {/* calendar-style date */}
      <div className="size-12 shrink-0 flex flex-col items-center justify-center rounded-lg bg-gray-50 dark:bg-zinc-800">
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {formatDate(night, { weekday: "short" })}
        </span>
        <span className="text-base font-semibold leading-none text-gray-900 dark:text-white">
          {formatDate(night, { day: "numeric" })}
        </span>
      </div>

      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
            {formatSleep(minutes)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-zinc-800 dark:text-gray-300">
            <span className={cn("size-2 rounded-full", quality.bar)} />
            <QualityIcon size={12} aria-hidden="true" />
            {quality.label}
          </span>
          {minutes >= SLEEP_TARGET_MINUTES && (
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              Target hit
            </span>
          )}
        </div>
        <p className="flex items-center gap-1.5 text-sm tabular-nums text-gray-500 dark:text-gray-400">
          <MoonIcon size={13} aria-label="Bed" />
          {formatTime(log.bedTime)}
          <span aria-hidden="true">→</span>
          <SunIcon size={13} aria-label="Woke" />
          {formatTime(log.wakeTime)}
        </p>
        {log.notes && (
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
            {log.notes}
          </p>
        )}
      </div>

      <div className="flex shrink-0">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit sleep for ${formatDate(night)}`}
          className={cn(
            iconButton,
            "hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-zinc-800 dark:hover:text-gray-200",
          )}
        >
          <PencilIcon size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete sleep for ${formatDate(night)}`}
          className={cn(
            iconButton,
            "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400",
          )}
        >
          <Trash2Icon size={16} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

export function SleepLogList({
  logs,
  isLoading,
  onEdit,
  onDelete,
  isDeleting,
  className,
}: {
  logs: SleepLog[];
  isLoading: boolean;
  onEdit: (log: SleepLog) => void;
  onDelete: (id: string, options: { onSuccess: () => void }) => void;
  isDeleting: boolean;
  className?: string;
}) {
  const [pendingDelete, setPendingDelete] = useState<SleepLog | null>(null);

  return (
    <WidgetCard
      title="Recent nights"
      icon={BedDoubleIcon}
      className={className}
    >
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        // fills the rest of the card and scrolls; the negative margins
        // let it run to the card's edges so rows scroll under the header
        // cleanly instead of stopping at the padding
        <div className="-mx-5 -mb-5 -mt-2 flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-2">
          <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
            {logs.map((log) => (
              <SleepLogRow
                key={log._id}
                log={log}
                onEdit={() => onEdit(log)}
                onDelete={() => setPendingDelete(log)}
              />
            ))}
          </ul>
        </div>
      )}

      <ConfirmModal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() =>
          pendingDelete &&
          onDelete(pendingDelete._id, {
            onSuccess: () => setPendingDelete(null),
          })
        }
        title="Delete this night?"
        description={
          pendingDelete
            ? `${formatSleep(sleepMinutes(pendingDelete))} on ${formatDate(keyToDate(nightKey(pendingDelete)))} will be removed.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        isPending={isDeleting}
        icon={Trash2Icon}
      />
    </WidgetCard>
  );
}
