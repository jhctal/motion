import { useState } from "react";
import { DumbbellIcon } from "lucide-react";
import { useWorkoutStats } from "../../api/workouts/use-workout-sessions";
import {
  SegmentedControl,
  StatSkeleton,
  StatValue,
  WidgetCard,
} from "./widget-card";

const PERIODS = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "1y", value: "1y" },
  { label: "All", value: "all" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

export function TotalLiftedWidget() {
  const [period, setPeriod] = useState<Period>("30d");
  const { data, isLoading } = useWorkoutStats(period);

  return (
    <WidgetCard
      title="Total lifted"
      icon={DumbbellIcon}
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
          value={Math.round(data?.totalWeight ?? 0)}
          unit="kg"
          detail="Weight × reps of completed sets"
        />
      )}
    </WidgetCard>
  );
}
