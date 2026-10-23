import mongoose from "mongoose";

// Embedded schema for individual sets within an exercise
const setSchema = new mongoose.Schema({
  setNumber: { type: Number, required: true },
  reps: { type: Number, default: 0 },
  weight: { type: Number, default: 0 }, // in lbs or kg
  durationInSeconds: { type: Number, default: 0 }, // for time-based exercises
  distance: { type: Number, default: 0 }, // for cardio exercises
  rpe: { type: Number, min: 1, max: 10 }, // Rate of Perceived Exertion
  restTime: { type: Number, default: 0 }, // rest time in seconds
  completed: { type: Boolean, default: false },
  notes: String,
});

// Embedded schema for exercises in a workout session
const exerciseSetSchema = new mongoose.Schema({
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exercise",
    required: true,
  },
  sets: [setSchema],
  // Calculated fields (populated by pre-save hook)
  totalSets: { type: Number, default: 0 },
  totalReps: { type: Number, default: 0 },
  maxWeight: { type: Number, default: 0 },
  // For cardio exercises
  duration: Number, // in minutes
  distance: Number, // in kilometers or miles
  notes: String,
});

const workoutSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    // Optional reference to a workout template
    workoutTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkoutTemplate",
      required: false,
    },
    exercises: [exerciseSetSchema],

    // Session tracking
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    duration: { type: Number, default: 0 }, // total workout time in minutes
    status: {
      type: String,
      enum: ["planned", "in-progress", "completed", "skipped"],
      default: "planned",
    },

    // Workout metrics
    totalSets: { type: Number, default: 0 },
    totalReps: { type: Number, default: 0 },
    totalWeight: { type: Number, default: 0 }, // total weight lifted
    avgRpe: { type: Number, default: 0 },

    // User feedback
    notes: String,
    rating: { type: Number, min: 1, max: 5 },
    feeling: {
      type: String,
      enum: ["terrible", "bad", "okay", "good", "amazing"],
    },

    // Location and environment
    location: String, // gym name, home, etc.
    tags: [String], // custom tags like 'morning', 'fasted', 'new-pr'

    // Original session id when restored from a backup file, used to skip duplicates
    importedFrom: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
workoutSessionSchema.index({ user: 1, status: 1, createdAt: -1 }); // covers filtered + sorted list queries
workoutSessionSchema.index({ user: 1, createdAt: -1 });             // covers unfiltered list queries
workoutSessionSchema.index({ user: 1, "exercises.exercise": 1 });
workoutSessionSchema.index({ user: 1, importedFrom: 1 }, { sparse: true });

// Calculate workout metrics before saving
workoutSessionSchema.pre("save", function (next) {
  if (this.exercises && this.exercises.length > 0) {
    let totalSets = 0;
    let totalReps = 0;
    let totalWeight = 0;
    let totalRpe = 0;
    let rpeCount = 0;

    this.exercises.forEach((exerciseSet) => {
      if (exerciseSet.sets && exerciseSet.sets.length > 0) {
        exerciseSet.sets.forEach((set) => {
          if (set.completed) {
            totalSets++;
            totalReps += set.reps || 0;
            totalWeight += (set.weight || 0) * (set.reps || 0);
            if (set.rpe) {
              totalRpe += set.rpe;
              rpeCount++;
            }
          }
        });

        // Update exercise-level totals
        exerciseSet.totalSets = exerciseSet.sets.filter(
          (set) => set.completed
        ).length;
        exerciseSet.totalReps = exerciseSet.sets.reduce(
          (sum, set) => sum + (set.completed ? set.reps || 0 : 0),
          0
        );
        exerciseSet.maxWeight = Math.max(
          ...exerciseSet.sets.map((set) =>
            set.completed ? set.weight || 0 : 0
          )
        );
      }
    });

    this.totalSets = totalSets;
    this.totalReps = totalReps;
    this.totalWeight = totalWeight;
    this.avgRpe = rpeCount > 0 ? totalRpe / rpeCount : 0;
  }

  // Calculate duration if completed
  if (this.status === "completed" && this.startedAt && this.completedAt) {
    this.duration = Math.round(
      (this.completedAt - this.startedAt) / (1000 * 60)
    );
  }

  next();
});

const WorkoutSession = mongoose.model("WorkoutSession", workoutSessionSchema);
export default WorkoutSession;
