import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  CalendarDaysIcon,
  DownloadIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
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
import { formatDate, formatSessionTitle } from "../../utils/format-date";
import ConfirmModal from "../../ui/modal/confirm-modal";
import { SegmentedControl, Skeleton } from "../../ui/widgets/widget-card";
import Button from "../../ui/button/button";
import ExportLogsModal from "../../ui/export-logs-modal";
import useImportLogs from "../../api/logged-workouts/use-import-logs";
import { ImportedSession, readBackupFile } from "../../utils/import-logs";
import { SessionCard, SessionTile } from "../../ui/workout-logs/session-card";
import { LogsCalendar } from "../../ui/workout-logs/logs-calendar";
import { sessionDate } from "../../ui/workout-logs/session-info";

const VIEWS = [
  { value: "list", label: "List", icon: ListIcon },
  { value: "grid", label: "Grid", icon: LayoutGridIcon },
  { value: "calendar", label: "Calendar", icon: CalendarDaysIcon },
] as const;

type View = (typeof VIEWS)[number]["value"];

const VIEW_KEY = "logs-view";

// Remembered per browser; storage can be blocked, so fall back to the list
function readView(): View {
  try {
    const stored = localStorage.getItem(VIEW_KEY);
    return VIEWS.find((v) => v.value === stored)?.value ?? "list";
  } catch {
    return "list";
  }
}

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
  const [view, setView] = useState<View>(readView);

  const changeView = (next: View) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // not remembered; fine
    }
  };

  const sessions = data?.workoutSessions ?? [];
  const months = groupByMonth(sessions);

  return (
    <PageWrapper pageName="Your workouts">
      <div className="flex flex-col gap-6 mt-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            label="Layout"
            size="md"
            options={VIEWS}
            value={view}
            onChange={changeView}
          />
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

        {view === "calendar" ? (
          <LogsCalendar onDelete={setToDelete} />
        ) : isLoading ? (
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
              {view === "grid" ? (
                // columns follow the page's width, not the screen's
                <div className="@container">
                  <ul className="grid gap-3 @2xl:grid-cols-2 @5xl:grid-cols-3 @[100rem]:grid-cols-4">
                    {items.map((session) => (
                      <li key={session._id} className="min-w-0">
                        <SessionTile
                          session={session}
                          onDelete={() => setToDelete(session)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
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
              )}
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
    const label = formatDate(sessionDate(session), {
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
