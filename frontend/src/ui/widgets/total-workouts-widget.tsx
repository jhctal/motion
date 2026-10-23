import { useState } from "react";
import { TrophyIcon } from "lucide-react";
import { useWorkoutStats } from "../../api/workouts/use-workout-sessions";
import { formatCompact } from "../../utils/format-date";
import {
  SegmentedControl,
  StatSkeleton,
  StatValue,
  WidgetCard,
} from "./widget-card";

const PERIODS = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
  { label: "All", value: "all" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

export function TotalWorkoutsWidget() {
  const [period, setPeriod] = useState<Period>("week");
  const { data, isLoading } = useWorkoutStats(period);
  const total = data?.totalWorkouts ?? 0;

  return (
    <WidgetCard
      title="Workouts completed"
      icon={TrophyIcon}
      action={
        <SegmentedControl
          label="Period"
          options={PERIODS}
          value={period}
          onChange={setPeriod}
        />
      }
    >
      {isLoading ? (
        <StatSkeleton />
      ) : (
        <StatValue
          value={total}
          unit={total === 1 ? "session" : "sessions"}
          detail={`${formatCompact(data?.totalSets ?? 0)} sets · ${formatCompact(data?.totalReps ?? 0)} reps`}
        />
      )}
    </WidgetCard>
  );
}
