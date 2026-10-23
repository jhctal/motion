import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useRef, useState } from "react";
import useListLogs, {
  WorkoutSession,
} from "../../api/logged-workouts/use-list-logs";
import { useDeleteLog } from "../../api/logged-workouts/use-delete-log";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";
import cn from "../../utils/cn";
import Button from "../../ui/button/button";
import fetchAllLogs from "../../api/logged-workouts/fetch-all-logs";
import { exportSessions } from "../../utils/export-logs";
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
  const goTo = useNavigate();
  const { data } = useListLogs();
  const remove = useDeleteLog();
  const [exporting, setExporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<ImportedSession[] | null>(
    null,
  );
  const [importError, setImportError] = useState<string | null>(null);

  async function handleExportAll(format: "json" | "csv") {
    setExporting(true);
    try {
      const sessions = await fetchAllLogs();
      const dates = sessions.map((s) => s.createdAt.slice(0, 10)).sort();
      const name = dates.length
        ? `workouts_${dates[0]}_${dates[dates.length - 1]}`
        : "workouts";
      exportSessions(sessions, format, name);
    } catch {
      alert("Failed to export workouts");
    } finally {
      setExporting(false);
    }
  }

  return (
    <PageWrapper pageName="Your Workouts">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 mt-2">
        <span className="text-sm text-gray-400 dark:text-gray-300">
          {data?.workoutSessions.length ?? 0} sessions
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <ImportButton onFileRead={setPendingImport} onError={setImportError} />
          <Button
            variant="outline"
            size="sm"
            disabled={exporting}
            onClick={() => handleExportAll("json")}
          >
            JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={exporting}
            onClick={() => handleExportAll("csv")}
          >
            CSV
          </Button>
          <Button onClick={() => goTo({ to: "/my-logs/new" })}>
            + Log workout
          </Button>
        </div>
      </div>
      {importError && (
        <div className="mb-3 p-3 border border-red-500 rounded text-sm text-red-500 flex justify-between gap-2">
          {importError}
          <button onClick={() => setImportError(null)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}
      {pendingImport && (
        <ImportPanel
          sessions={pendingImport}
          onClose={() => setPendingImport(null)}
        />
      )}
      <div className="flex flex-col gap-2">
        {data?.workoutSessions.map((session) => (
          <SessionCard
            key={session._id}
            session={session}
            onDelete={() => {
              if (confirm(`Delete "${session.name}"?`)) {
                remove.mutate(session._id);
              }
            }}
            isDeleting={remove.isPending}
          />
        ))}
      </div>
    </PageWrapper>
  );
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
      onError(
        err instanceof Error ? err.message : "Couldn't read that file",
      );
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
      >
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
    <div className="mb-3 p-3 border rounded text-sm flex flex-col gap-2">
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
          <Button variant="outline" size="sm" className="self-start" onClick={onClose}>
            Done
          </Button>
        </>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({
  className,
  status,
}: {
  className?: string;
  status: string;
}) {
  const colours: Record<string, string> = {
    completed: "bg-green-600 text-white",
    "in-progress": "bg-orange-500 text-white",
    planned: "bg-gray-700 text-gray-300",
  };
  const cls = colours[status] ?? "bg-gray-700 text-gray-300";
  return (
    <span className={cn(`text-xs px-1.5 py-0.5 rounded ${cls}`, className)}>
      {status}
    </span>
  );
}
function MiniStatusBadge({
  className,
  status,
}: {
  className?: string;
  status: string;
}) {
  const colours: Record<string, string> = {
    completed: "bg-green-600 text-white",
    "in-progress": "bg-orange-500 text-white",
    planned: "bg-gray-700 text-gray-300",
  };
  const cls = colours[status] ?? "bg-gray-700 text-gray-300";
  return (
    <span
      className={cn(
        `text-xs p-1 size-6 text-center rounded-full ${cls}`,
        className,
      )}
    >
      {status.charAt(0)}
    </span>
  );
}

function SessionCard({
  session,
  onDelete,
  isDeleting,
}: {
  session: WorkoutSession;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="border rounded flex items-stretch py-2 pr-2">
      <Link
        to="/my-logs/$id"
        params={{ id: session._id }}
        className="flex-1 p-3 min-w-0"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-0.5">
          <span className="font-medium text-lg md:text-sm capitalize flex items-center gap-1">
            {session.name}
            <MiniStatusBadge
              className="block md:hidden"
              status={session.status}
            />
          </span>
          <StatusBadge className="hidden md:block" status={session.status} />
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-300 flex gap-3">
          <span>{formatDate(session.createdAt)}</span>
          {session.exercises.length > 0 && (
            <span className="hidden md:block">
              {session.exercises.length} exercises
            </span>
          )}
          {session.totalSets > 0 && (
            <span className="hidden md:block">{session.totalSets} sets</span>
          )}
        </div>
      </Link>

      {confirming ? (
        <div className="flex items-center gap-3 px-3 shrink-0">
          <button
            onClick={() => {
              onDelete();
              setConfirming(false);
            }}
            disabled={isDeleting}
            className="px-2 py-1.5 text-xs font-semibold text-red-600 bg-white rounded-lg cursor-pointer hover:text-white hover:bg-red-500 disabled:opacity-40"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="px-2 py-1.5 w-16 text-xs text-gray-400 dark:text-gray-300 border cursor-pointer rounded-lg hover:border-black hover:text-black"
          >
            No
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="px-5 py-4 font-bold cursor-pointer rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-colors text-lg sm:px-3 sm:py-0 sm:text-sm"
          aria-label="Delete log"
        >
          ✕
        </button>
      )}
    </div>
  );
}
