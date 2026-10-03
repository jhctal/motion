import { useState } from "react";
import { useWorkoutStats } from "../../api/workouts/use-workout-sessions";
import TabButton from "../tab-button";

const PERIODS = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
  { label: "Total", value: "all" },
] as const;

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 2h12v6a6 6 0 01-12 0V2zm-2 0H2v4a4 4 0 003 3.87V10a7 7 0 006 6.92V19H8a1 1 0 000 2h8a1 1 0 000-2h-3v-2.08A7 7 0 0019 10V9.87A4 4 0 0022 6V2h-2v4a2 2 0 01-1.17 1.83A8 8 0 008.17 7.83 2 2 0 014 6V2z" />
    </svg>
  );
}

export function TotalWorkoutsWidget() {
  const [period, setPeriod] = useState<string>("week");
  const { data, isLoading } = useWorkoutStats(period);

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-gray-300 uppercase tracking-wide">
          Workouts Completed
        </p>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <TabButton
              active={period === p.value}
              key={p.value}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </TabButton>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <TrophyIcon className="w-12 h-auto text-orange-400 shrink-0" />
        <div>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <>
              <p className="text-3xl font-bold leading-none">
                {data?.totalWorkouts ?? 0}
                <span className="text-lg font-normal text-gray-400 dark:text-gray-300 ml-1">
                  sessions
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(data?.totalSets ?? 0).toLocaleString()} sets ·{" "}
                {(data?.totalReps ?? 0).toLocaleString()} reps
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
