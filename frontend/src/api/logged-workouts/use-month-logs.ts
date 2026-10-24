import { keepPreviousData, useQuery } from "@tanstack/react-query";
import fetchAllLogs from "./fetch-all-logs";

// Every workout in one calendar month (local time), for the calendar view.
// Shares the "list-logs" prefix so deleting a log refreshes it too.
function useMonthLogs(year: number, month: number) {
  return useQuery({
    queryKey: ["list-logs", "month", year, month],
    queryFn: () =>
      fetchAllLogs({
        startDate: new Date(year, month, 1).toISOString(),
        endDate: new Date(year, month + 1, 1).toISOString(),
      }),
    // keep the old month on screen while the next one loads
    placeholderData: keepPreviousData,
  });
}

export default useMonthLogs;
