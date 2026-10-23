// frontend/src/api/workout-sessions/use-workout-sessions.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { WorkoutSession, WorkoutStats } from "../workout-types";

// Get user's workout sessions
export const useWorkoutSessions = (params?: {
  status?: string;
  limit?: number;
  page?: number;
  startDate?: string;
  endDate?: string;
  populate?: "true" | "false";
  count?: "true" | "false";
}) => {
  return useQuery({
    queryKey: ["workout-sessions", params],
    queryFn: async () => {
      const response = await axios.get("/api/workout-sessions", { params });
      return response.data;
    },
  });
};

// Get single workout session
export const useWorkoutSession = (id: string) => {
  return useQuery({
    queryKey: ["workout-session", id],
    queryFn: async () => {
      const response = await axios.get(`/api/workout-sessions/${id}`);
      return response.data as WorkoutSession;
    },
    enabled: !!id,
  });
};

// Create workout session
export const useCreateWorkoutSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      basedOnWorkout?: string;
      exercises?: unknown[];
    }) => {
      const response = await axios.post("/api/workout-sessions", data);
      return response.data as WorkoutSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-sessions"] });
    },
  });
};

// Start workout session
export const useStartWorkoutSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.put(`/api/workout-sessions/${id}/start`);
      return response.data as WorkoutSession;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["workout-session", id] });
      queryClient.invalidateQueries({ queryKey: ["workout-sessions"] });
    },
  });
};

// Complete workout session
export const useCompleteWorkoutSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      rating,
      feeling,
      notes,
      completedAt,
    }: {
      id: string;
      rating?: number;
      feeling?: string;
      notes?: string;
      // ISO time the workout ended; defaults to now on the server
      completedAt?: string;
    }) => {
      const response = await axios.put(`/api/workout-sessions/${id}/complete`, {
        rating,
        feeling,
        notes,
        completedAt,
      });
      return response.data as WorkoutSession;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["workout-session", id] });
      queryClient.invalidateQueries({ queryKey: ["workout-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["personal-records"] });
    },
  });
};

// Update exercise set
export const useUpdateExerciseSet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      exerciseIndex,
      setData,
    }: {
      sessionId: string;
      exerciseIndex: number;
      setData: unknown;
    }) => {
      const response = await axios.put(
        `/api/workout-sessions/${sessionId}/exercises/${exerciseIndex}/sets`,
        { setData },
      );
      return response.data as WorkoutSession;
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: ["workout-session", sessionId],
      });
    },
  });
};

// Delete a set from an exercise in a workout session
export const useDeleteExerciseSet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      exerciseIndex,
      setNumber,
    }: {
      sessionId: string;
      exerciseIndex: number;
      setNumber: number;
    }) => {
      const response = await axios.delete(
        `/api/workout-sessions/${sessionId}/exercises/${exerciseIndex}/sets/${setNumber}`,
      );
      return response.data as WorkoutSession;
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: ["workout-session", sessionId],
      });
    },
  });
};

// Add exercise to workout session
export const useAddExerciseToSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      exerciseId,
    }: {
      sessionId: string;
      exerciseId: string;
    }) => {
      const response = await axios.post(
        `/api/workout-sessions/${sessionId}/exercises`,
        { exerciseId },
      );
      return response.data as WorkoutSession;
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: ["workout-session", sessionId],
      });
    },
  });
};

// Remove exercise from workout session
export const useRemoveExerciseFromSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      exerciseIndex,
    }: {
      sessionId: string;
      exerciseIndex: number;
    }) => {
      const response = await axios.delete(
        `/api/workout-sessions/${sessionId}/exercises/${exerciseIndex}`,
      );
      return response.data as WorkoutSession;
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: ["workout-session", sessionId],
      });
    },
  });
};

// Delete workout session
export const useDeleteWorkoutSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/workout-sessions/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-sessions"] });
    },
  });
};

// Get workout statistics
export const useWorkoutStats = (period: string = "30d") => {
  return useQuery({
    queryKey: ["workout-stats", period],
    queryFn: async () => {
      const response = await axios.get("/api/workout-sessions/stats", {
        params: { period },
      });
      return response.data as WorkoutStats;
    },
  });
};
