import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { ImportedSession } from "../../utils/import-logs";

// Small batches keep each request under the server's JSON body limit
const BATCH_SIZE = 10;

type ImportIssue = { name: string; reason: string };

export type ImportResult = {
  imported: number;
  skipped: ImportIssue[];
  failed: ImportIssue[];
  createdExercises: string[];
};

function useImportLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessions: ImportedSession[]) => {
      const total: ImportResult = {
        imported: 0,
        skipped: [],
        failed: [],
        createdExercises: [],
      };

      for (let i = 0; i < sessions.length; i += BATCH_SIZE) {
        const response = await axios.post<ImportResult>(
          "/api/workout-sessions/import",
          { sessions: sessions.slice(i, i + BATCH_SIZE) },
        );
        total.imported += response.data.imported;
        total.skipped.push(...response.data.skipped);
        total.failed.push(...response.data.failed);
        total.createdExercises.push(...response.data.createdExercises);
      }

      return total;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["list-logs"] });
    },
  });
}

export default useImportLogs;
