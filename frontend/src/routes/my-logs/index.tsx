import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ChevronRightIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CirclePlayIcon,
  CircleSlashIcon,
  ClockIcon,
  DownloadIcon,
  DumbbellIcon,
  LayersIcon,
  ListIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import useListLogs, {
  WorkoutSession,
} from "../../api/logged-workouts/use-list-logs";
import { useDeleteLog } from "../../api/logged-workouts/use-delete-log";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";
import cn from "../../utils/cn";
import {
  formatCompact,
  formatDate,
  formatDuration,
  formatSessionTitle,
} from "../../utils/format-date";
import MuscleTag from "../../ui/muscle-tag";
import ConfirmModal from "../../ui/modal/confirm-modal";
import { Skeleton } from "../../ui/widgets/widget-card";
import Button from "../../ui/button/button";
import ExportLogsModal from "../../ui/export-logs-modal";
import useImportLogs from "../../api/logged-workouts/use-import-logs";
import { ImportedSession, readBackupFile } from "../../utils/import-logs";

export const Route = createFileRoute("/my-logs/")({
  beforeLoad: async () => {
    const user = localStorage.getItem("user");
    if (!user) {
      throw redirect({ to: "/auth" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isLoading } = useListLogs();
  const remove = useDeleteLog();
  const [exportOpen, setExportOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<ImportedSession[] | null>(
    null,
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<WorkoutSession | null>(null);

  const sessions = data?.workoutSessions ?? [];
  const months = groupByMonth(sessions);

  return (
    <PageWrapper pageName="Your workouts">
      <div className="flex flex-col gap-6 mt-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {sessions.length} {sessions.length === 1 ? "workout" : "workouts"}{" "}
            logged
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <ImportButton
              onFileRead={setPendingImport}
              onError={setImportError}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setExportOpen(true)}
            >
              <DownloadIcon size={14} aria-hidden="true" />
              Export
            </Button>
            <Link to="/my-logs/new">
              <Button size="sm" className="gap-1.5">
                <PlusIcon size={14} aria-hidden="true" />
                Log workout
              </Button>
            </Link>
          </div>
        </div>

        {importError && (
          <div
            role="alert"
            className="flex items-start justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          >
            {importError}
            <button
              type="button"
              onClick={() => setImportError(null)}
              aria-label="Dismiss"
              className="shrink-0"
            >
              <XIcon size={16} />
            </button>
          </div>
        )}
        {pendingImport && (
          <ImportPanel
            sessions={pendingImport}
            onClose={() => setPendingImport(null)}
          />
        )}

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 py-14 text-center dark:border-zinc-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No workouts logged yet
            </p>
            <Link to="/my-logs/new">
              <Button size="sm">Log your first workout</Button>
            </Link>
          </div>
        ) : (
          months.map(({ label, items }) => (
            <section key={label} className="flex flex-col gap-3">
              <h2 className="flex items-baseline gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                {label}
                <span className="text-xs font-normal text-gray-400">
                  {items.length} {items.length === 1 ? "workout" : "workouts"}
                </span>
              </h2>
              <ul className="flex flex-col gap-2">
                {items.map((session) => (
                  <li key={session._id} className="min-w-0">
                    <SessionCard
                      session={session}
                      onDelete={() => setToDelete(session)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      <ExportLogsModal open={exportOpen} onClose={() => setExportOpen(false)} />
      <ConfirmModal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            remove.mutate(toDelete._id, { onSuccess: () => setToDelete(null) });
          }
        }}
        title="Delete this workout?"
        description={
          toDelete
            ? `"${formatSessionTitle(toDelete)}" and all its sets will be permanently removed.`
            : undefined
        }
        confirmLabel="Delete workout"
        destructive
        icon={Trash2Icon}
        isPending={remove.isPending}
      />
    </PageWrapper>
  );
}

// Newest first, as the API returns them, split into calendar months
function groupByMonth(sessions: WorkoutSession[]) {
  const months: { label: string; items: WorkoutSession[] }[] = [];
  for (const session of sessions) {
    const label = formatDate(session.startedAt ?? session.createdAt, {
      month: "long",
      year: "numeric",
    });
    const last = months[months.length - 1];
    if (last?.label === label) last.items.push(session);
    else months.push({ label, items: [session] });
  }
  return months;
}

function ImportButton({
  onFileRead,
  onError,
}: {
  onFileRead: (sessions: ImportedSession[]) => void;
  onError: (message: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    try {
      const sessions = await readBackupFile(file);
      if (sessions.length === 0) throw new Error("No workouts found in file");
      onError(null);
      onFileRead(sessions);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Couldn't read that file");
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json,.csv,application/json,text/csv"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        className="gap-1.5"
      >
        <UploadIcon size={14} aria-hidden="true" />
        Import
      </Button>
    </>
  );
}

function ImportPanel({
  sessions,
  onClose,
}: {
  sessions: ImportedSession[];
  onClose: () => void;
}) {
  const importLogs = useImportLogs();
  const result = importLogs.data;
  const setCount = sessions.reduce(
    (total, s) => total + s.exercises.reduce((n, ex) => n + ex.sets.length, 0),
    0,
  );

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {!result ? (
        <>
          <p>
            Found <strong>{sessions.length}</strong> workout
            {sessions.length === 1 ? "" : "s"} with {setCount} sets. Workouts
            you already have will be skipped.
          </p>
          {importLogs.isError && (
            <p className="text-red-500">
              Import failed part-way. Workouts already imported were kept;
              running it again will skip them.
            </p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={importLogs.isPending}
              onClick={() => importLogs.mutate(sessions)}
            >
              {importLogs.isPending ? "Importing…" : "Import"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={importLogs.isPending}
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <p>
            Imported <strong>{result.imported}</strong>, skipped{" "}
            {result.skipped.length} already present
            {result.failed.length > 0 && `, ${result.failed.length} failed`}.
          </p>
          {result.createdExercises.length > 0 && (
            <p className="text-gray-500 dark:text-gray-300">
              New custom exercises: {result.createdExercises.join(", ")}
            </p>
          )}
          {result.failed.length > 0 && (
            <ul className="text-red-500 list-disc pl-5">
              {result.failed.map((f, i) => (
                <li key={i}>
                  {f.name}: {f.reason}
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={onClose}
          >
            Done
          </Button>
        </>
      )}
    </div>
  );
}

const STATUS = {
  completed: {
    label: "Completed",
    icon: CircleCheckIcon,
    tile: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400",
    badge:
      "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/30",
  },
  "in-progress": {
    label: "In progress",
    icon: CirclePlayIcon,
    tile: "bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400",
    badge:
      "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/30",
  },
  planned: {
    label: "Planned",
    icon: CircleDashedIcon,
    tile: "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400",
    badge:
      "bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-zinc-800 dark:text-gray-300 dark:ring-zinc-600",
  },
  skipped: {
    label: "Skipped",
    icon: CircleSlashIcon,
    tile: "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400",
    badge:
      "bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-zinc-800 dark:text-gray-300 dark:ring-zinc-600",
  },
} as const;

const statusOf = (status: string) =>
  STATUS[status as keyof typeof STATUS] ?? STATUS.planned;

function SessionCard({
  session,
  onDelete,
}: {
  session: WorkoutSession;
  onDelete: () => void;
}) {
  const status = statusOf(session.status);
  const StatusIcon = status.icon;
  const isCompleted = session.status === "completed";

  const allSets = session.exercises.flatMap((ex) => ex.sets ?? []);
  const doneSets = allSets.filter((set) => set.completed).length;

  const muscles = [
    ...new Set(
      session.exercises
        .map((ex) => ex.exercise?.mainTargetMuscle)
        .filter((m): m is string => !!m),
    ),
  ];

  const stats = [
    isCompleted && session.duration > 0
      ? { icon: ClockIcon, text: formatDuration(session.duration) }
      : null,
    allSets.length > 0
      ? {
          icon: LayersIcon,
          text: isCompleted
            ? `${doneSets} sets`
            : `${doneSets}/${allSets.length} sets`,
        }
      : null,
    session.totalWeight > 0
      ? { icon: DumbbellIcon, text: `${formatCompact(session.totalWeight)} kg` }
      : null,
    session.exercises.length > 0
      ? {
          icon: ListIcon,
          text: `${session.exercises.length} ${session.exercises.length === 1 ? "exercise" : "exercises"}`,
        }
      : null,
    session.rating ? { icon: StarIcon, text: `${session.rating}/5` } : null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);

  return (
    <div className="group flex items-stretch rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-orange-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-orange-500/50">
      <Link
        to="/my-logs/$id"
        params={{ id: session._id }}
        className="flex-1 min-w-0 flex gap-4 p-4"
      >
        <span
          className={cn(
            "size-10 shrink-0 grid place-items-center rounded-lg",
            status.tile,
          )}
        >
          <StatusIcon size={20} aria-hidden="true" />
        </span>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
            <h3 className="min-w-0 truncate font-semibold capitalize text-gray-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
              {formatSessionTitle(session)}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                status.badge,
              )}
            >
              {status.label}
            </span>
          </div>

          {muscles.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {muscles.slice(0, 4).map((m) => (
                <MuscleTag key={m} muscle={m} />
              ))}
              {muscles.length > 4 && (
                <span className="text-xs text-gray-400">
                  +{muscles.length - 4}
                </span>
              )}
            </div>
          )}

          {stats.length > 0 && (
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              {stats.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="inline-flex items-center gap-1 tabular-nums"
                >
                  <Icon size={12} aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          )}
        </div>

        <ChevronRightIcon
          size={18}
          aria-hidden="true"
          className="hidden sm:block self-center shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-500 dark:text-zinc-600"
        />
      </Link>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${formatSessionTitle(session)}`}
        className="shrink-0 self-start m-2 size-9 grid place-items-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-red-500/10 dark:hover:text-red-400"
      >
        <Trash2Icon size={16} />
      </button>
    </div>
  );
}
