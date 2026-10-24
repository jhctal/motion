import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface SleepLog {
  _id: string;
  user: string;
  date: string;
  bedTime: string;
  wakeTime: string;
  durationMinutes: number;
  quality: "poor" | "fair" | "good" | "excellent";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateSleepLog = Omit<
  SleepLog,
  "_id" | "user" | "durationMinutes" | "createdAt" | "updatedAt"
>;

export const useSleepLogs = (params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["sleep-logs", params],
    queryFn: async () => {
      const response = await axios.get("/api/sleep-logs", { params });
      return response.data as SleepLog[];
    },
  });
};

export const useCreateSleepLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSleepLog) => {
      const response = await axios.post("/api/sleep-logs", data);
      return response.data as SleepLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sleep-logs"] });
    },
  });
};

export const useUpdateSleepLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: CreateSleepLog & { id: string }) => {
      const response = await axios.put(`/api/sleep-logs/${id}`, data);
      return response.data as SleepLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sleep-logs"] });
    },
  });
};

export const useDeleteSleepLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/sleep-logs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sleep-logs"] });
    },
  });
};
