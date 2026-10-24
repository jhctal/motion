import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";
import {
  useSleepLogs,
  useDeleteSleepLog,
  type SleepLog,
} from "../../api/sleep/use-sleep-logs";
import Button from "../../ui/button/button";
import { SleepStats } from "../../ui/sleep/sleep-stats";
import { SleepChart } from "../../ui/sleep/sleep-chart";
import { SleepLogList } from "../../ui/sleep/sleep-log-list";
import { LogSleepModal } from "../../ui/sleep/log-sleep-modal";
import { SleepyArt } from "../../ui/sleep/sleepy-art";
import { QUALITY_STYLES } from "../../ui/sleep/quality";
import { formatSleep, groupByNight, lastNightKey } from "../../utils/sleep";

export const Route = createFileRoute("/sleep/")({
  component: RouteComponent,
});

function RouteComponent() {
  // enough for the 1M chart plus the week-on-week comparison
  const { data: logs = [], isLoading } = useSleepLogs({ limit: 60 });
  const deleteLog = useDeleteSleepLog();
  const [logOpen, setLogOpen] = useState(false);
  const [editing, setEditing] = useState<SleepLog | null>(null);

  const nights = groupByNight(logs);
  const isEmpty = !isLoading && logs.length === 0;
  const lastNight = nights.get(lastNightKey());

  return (
    <PageWrapper>
      <div className="flex flex-col gap-4 max-w-6xl">
        {isEmpty ? (
          <>
            <h1 className="font-semibold text-xl">Sleep</h1>
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-zinc-700">
              <SleepyArt className="w-64 max-w-full h-auto" />
              <div className="flex flex-col gap-1 max-w-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No sleep logged yet
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Muscles recover while you sleep. Log your nights to see your
                  averages, schedule and how often you hit 8 hours.
                </p>
              </div>
              <Button className="gap-1.5" onClick={() => setLogOpen(true)}>
                <PlusIcon size={16} aria-hidden="true" />
                Log last night
              </Button>
            </div>
          </>
        ) : (
          <>
            <section className="relative overflow-hidden rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 via-amber-50/60 to-white dark:border-zinc-800 dark:from-orange-500/10 dark:via-zinc-900 dark:to-zinc-900">
              <div className="relative z-10 flex flex-col gap-4 p-6 sm:max-w-[60%]">
                <div className="flex flex-col gap-1">
                  <h1 className="font-semibold text-2xl text-gray-900 dark:text-white">
                    Sleep
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recovery starts the night before.
                  </p>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {isLoading ? (
                    "\u00a0"
                  ) : lastNight ? (
                    <>
                      Last night you slept{" "}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatSleep(lastNight.minutes)}
                      </span>
                      {" · "}
                      {QUALITY_STYLES[
                        lastNight.quality
                      ].label.toLowerCase()}{" "}
                      quality
                    </>
                  ) : (
                    "Nothing logged for last night yet."
                  )}
                </p>
                <Button
                  className="gap-1.5 w-fit"
                  onClick={() => setLogOpen(true)}
                >
                  <PlusIcon size={16} aria-hidden="true" />
                  Log sleep
                </Button>
              </div>
              {/* sits behind the text on phones, beside it from sm up */}
              <SleepyArt className="absolute -right-6 top-1/2 -translate-y-1/2 w-56 opacity-40 sm:opacity-100 sm:w-72 sm:right-4 lg:right-10" />
            </section>

            <SleepStats nights={nights} isLoading={isLoading} />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3">
                <SleepChart nights={nights} isLoading={isLoading} />
              </div>
              {/* On desktop the list is taken out of flow so the chart alone
                  sets the row height; the list matches it and scrolls */}
              <div className="lg:col-span-2 lg:relative">
                <SleepLogList
                  className="max-h-[32rem] lg:max-h-none lg:absolute lg:inset-0"
                  logs={logs}
                  isLoading={isLoading}
                  onEdit={setEditing}
                  onDelete={(id, options) => deleteLog.mutate(id, options)}
                  isDeleting={deleteLog.isPending}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <LogSleepModal open={logOpen} onClose={() => setLogOpen(false)} />
      {/* keyed so the form starts from the chosen log's values */}
      <LogSleepModal
        key={editing?._id}
        open={editing !== null}
        log={editing ?? undefined}
        onClose={() => setEditing(null)}
      />
    </PageWrapper>
  );
}
