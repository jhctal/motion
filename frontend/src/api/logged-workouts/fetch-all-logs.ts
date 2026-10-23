import axios from "axios";
import type { WorkoutSession } from "./use-list-logs";

const PAGE_SIZE = 100;

// The list endpoint is paginated, so walk every page
async function fetchAllLogs(): Promise<WorkoutSession[]> {
  const sessions: WorkoutSession[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await axios.get("/api/workout-sessions", {
      params: { page, limit: PAGE_SIZE },
    });
    sessions.push(...response.data.workoutSessions);
    totalPages = response.data.pagination.totalPages ?? 1;
    page++;
  } while (page <= totalPages);

  return sessions;
}

export default fetchAllLogs;
