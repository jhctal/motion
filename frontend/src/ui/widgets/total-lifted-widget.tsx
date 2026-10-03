import { useState } from "react";
import { useWorkoutStats } from "../../api/workouts/use-workout-sessions";
import TabButton from "../tab-button";

const PERIODS = [
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "1y", value: "1y" },
  { label: "All", value: "all" },
] as const;

function formatWeight(kg: number) {
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(1)}M`;
  if (kg >= 1_000) return `${(kg / 1_000).toFixed(1)}k`;
  return kg.toLocaleString();
}

function BarbellIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 48"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      {/* Bar */}
      <rect x="22" y="21" width="76" height="6" rx="3" />

      {/* Left collar */}
      <rect x="18" y="17" width="5" height="14" rx="1.5" />

      {/* Left inner plate */}
      <rect x="10" y="13" width="8" height="22" rx="2" />

      {/* Left outer plate */}
      <rect x="2" y="8" width="9" height="32" rx="2.5" />

      {/* Right collar */}
      <rect x="97" y="17" width="5" height="14" rx="1.5" />

      {/* Right inner plate */}
      <rect x="102" y="13" width="8" height="22" rx="2" />

      {/* Right outer plate */}
      <rect x="109" y="8" width="9" height="32" rx="2.5" />
    </svg>
  );
}

export function TotalLiftedWidget() {
  const [period, setPeriod] = useState<string>("30d");
  const { data, isLoading } = useWorkoutStats(period);

  return (
    <div className="h-full border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-gray-300 uppercase tracking-wide">
          Total Lifted
        </p>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <TabButton
              key={p.value}
              active={period === p.value}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </TabButton>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <BarbellIcon className="w-16 h-auto text-orange-400 shrink-0" />
        <div>
          {isLoading ? (
            <p className="text-sm text-gray-500 h-[53.5px]">Loading…</p>
          ) : (
            <>
              <p className="text-3xl font-bold leading-none">
                {formatWeight(data?.totalWeight ?? 0)}
                <span className="text-lg font-normal text-gray-400 dark:text-gray-300 ml-1">
                  kg
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data?.totalWorkouts ?? 0} sessions ·{" "}
                {(data?.totalReps ?? 0).toLocaleString()} reps
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
