import { useMemo, useState } from "react";
import { useWorkoutSessions } from "./use-workout-sessions";
import { lastTrainedByMuscle, RECOVERY_HOURS } from "../../utils/recovery";

// Muscles trained in the recovery window, with when they were last trained
function useRecentlyTrainedMuscles() {
  // fixed for the life of the component so the query key stays stable
  const [since] = useState(() =>
    new Date(Date.now() - RECOVERY_HOURS * 60 * 60 * 1000).toISOString(),
  );
  const { data } = useWorkoutSessions({
    startDate: since,
    limit: 50,
    count: "false",
  });

  return useMemo(
    () => lastTrainedByMuscle(data?.workoutSessions ?? []),
    [data],
  );
}

export default useRecentlyTrainedMuscles;
