import { useQuery } from "@tanstack/react-query";
import axios from "axios";

type Exercise = {
  _id: string;
  category: string;
  description: string;
  difficulty: string;
  duration: number;
  equipmentNeeded: string[];
  image: string;
  // start and finish photos
  images?: string[];
  mainTargetMuscle: string;
  muscleGroups: string[];
  isCompound: boolean;
  instructions?: string;
  name: string;
};

export const useListExercises = () => {
  return useQuery<Exercise[]>({
    queryKey: ["list-all-exercises"],
    queryFn: async () => {
      const response = await axios.get("/api/exercises");
      return response.data;
    },
  });
};

export type { Exercise };
