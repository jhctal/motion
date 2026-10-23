import { useMemo, useState } from "react";
import { useWorkoutSessions } from "./use-workout-sessions";
import { HISTORY_DAYS, summariseHistory } from "../../utils/training-history";

// A single request for the last HISTORY_DAYS of sessions, summarised for the planner
function useTrainingHistory() {
  // fixed for the life of the component so the query key stays stable
  const [since] = useState(() =>
    new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  );
  const { data } = useWorkoutSessions({
    startDate: since,
    limit: 100,
    count: "false",
  });

  return useMemo(() => summariseHistory(data?.workoutSessions ?? []), [data]);
}

export default useTrainingHistory;
