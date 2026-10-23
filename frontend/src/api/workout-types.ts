export interface ExerciseSet {
  setNumber: number;
  reps: number;
  weight: number;
  durationInSeconds?: number;
  distance?: number;
  rpe?: number;
  restTime?: number;
  completed: boolean;
  notes?: string;
}

export interface PopulatedExercise {
  _id: string;
  name: string;
  category: string;
  mainTargetMuscle: string;
}

export interface WorkoutExercise {
  _id?: string;
  exercise: string | PopulatedExercise; // Exercise ID or populated object
  sets: ExerciseSet[];
  totalSets?: number;
  totalReps?: number;
  maxWeight?: number;
  notes?: string;
}

export interface WorkoutSession {
  _id: string;
  user: string;
  name: string;
  workoutTemplate?: string;
  exercises: WorkoutExercise[];
  startedAt: string;
  completedAt?: string;
  duration: number;
  status: "planned" | "in-progress" | "completed" | "skipped";
  totalSets: number;
  totalReps: number;
  totalWeight: number;
  avgRpe: number;
  notes?: string;
  rating?: number;
  feeling?: "terrible" | "bad" | "okay" | "good" | "amazing";
  location?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalWeight: number;
  avgDuration: number;
  avgRating: number;
  avgRpe: number;
}

export interface PersonalRecord {
  _id: string;
  user: string;
  exercise: {
    _id: string;
    name: string;
    category: string;
    mainTargetMuscle: string;
  };
  recordType:
    | "1rm"
    | "max-reps"
    | "max-weight"
    | "max-volume"
    | "longest-duration";
  value: number;
  unit: string;
  achievedDate: string;
  workoutSession?: string;
  setDetails?: {
    reps?: number;
    weight?: number;
    duration?: number;
  };
  previousRecord?: {
    value: number;
    date: string;
  };
  improvement: number;
  notes?: string;
  verified: boolean;
}
