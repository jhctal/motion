import { useMemo, useState } from "react";
import { useWorkoutSessions } from "./use-workout-sessions";
import { HISTORY_DAYS, summariseHistory } from "../../utils/training-history";

// A single request for the last HISTORY_DAYS of sessions, summarised.
// Pass the session being logged so its own sets don't count as "last time".
function useTrainingHistory(excludeSessionId?: string) {
  // fixed for the life of the component so the query key stays stable
  const [since] = useState(() =>
    new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  );
  const { data } = useWorkoutSessions({
    startDate: since,
    limit: 100,
    count: "false",
  });

  return useMemo(
    () =>
      summariseHistory(
        (data?.workoutSessions ?? []).filter(
          (session: { _id: string }) => session._id !== excludeSessionId,
        ),
      ),
    [data, excludeSessionId],
  );
}

export default useTrainingHistory;
