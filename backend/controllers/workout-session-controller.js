// backend/controllers/workout-session-controller.js
import asyncHandler from "../middleware/async-handler.js";
import WorkoutSession from "../models/workout-session-model.js";
import Exercise from "../models/exercise-model.js";
import PersonalRecord from "../models/personal-record-model.js";
import mongoose from "mongoose";
import {
  CATEGORIES,
  normaliseImportedSession,
} from "../utils/normalise-imported-session.js";

// @desc Create a new workout session
// @route POST /api/workout-sessions
// @access Private
const createWorkoutSession = asyncHandler(async (req, res) => {
  const { name, workoutTemplate, exercises } = req.body;

  const workoutSession = await WorkoutSession.create({
    user: req.user._id,
    name,
    workoutTemplate,
    exercises: exercises || [],
    status: "planned",
  });

  await workoutSession.populate(
    "exercises.exercise",
    "name category mainTargetMuscle"
  );

  res.status(201).json(workoutSession);
});

// @desc Start a workout session
// @route PUT /api/workout-sessions/:id/start
// @access Private
const startWorkoutSession = asyncHandler(async (req, res) => {
  const workoutSession = await WorkoutSession.findById(req.params.id);

  if (!workoutSession) {
    res.status(404);
    throw new Error("Workout session not found");
  }

  if (workoutSession.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to modify this workout");
  }

  workoutSession.status = "in-progress";
  workoutSession.startedAt = new Date();

  await workoutSession.save();

  res.json(workoutSession);
});

// @desc Complete a workout session
// @route PUT /api/workout-sessions/:id/complete
// @access Private
const completeWorkoutSession = asyncHandler(async (req, res) => {
  const { rating, feeling, notes } = req.body;

  const workoutSession = await WorkoutSession.findById(req.params.id);

  if (!workoutSession) {
    res.status(404);
    throw new Error("Workout session not found");
  }

  if (workoutSession.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to modify this workout");
  }

  workoutSession.status = "completed";
  workoutSession.completedAt = new Date();
  workoutSession.rating = rating;
  workoutSession.feeling = feeling;
  workoutSession.notes = notes;

  await workoutSession.save();

  // Check for new personal records
  await checkForPersonalRecords(workoutSession);

  res.json(workoutSession);
});

// @desc Add/Update exercise set in workout session
// @route PUT /api/workout-sessions/:id/exercises/:exerciseIndex/sets
// @access Private
const updateExerciseSet = asyncHandler(async (req, res) => {
  const { exerciseIndex } = req.params;
  const { setData } = req.body; // { setNumber, reps, weight, completed, etc. }

  const workoutSession = await WorkoutSession.findById(req.params.id);

  if (!workoutSession) {
    res.status(404);
    throw new Error("Workout session not found");
  }

  if (workoutSession.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to modify this workout");
  }

  const exerciseSet = workoutSession.exercises[exerciseIndex];
  if (!exerciseSet) {
    res.status(404);
    throw new Error("Exercise not found in workout");
  }

  // Find existing set or create new one
  const existingSetIndex = exerciseSet.sets.findIndex(
    (set) => set.setNumber === setData.setNumber
  );

  if (existingSetIndex >= 0) {
    // Update existing set
    Object.assign(exerciseSet.sets[existingSetIndex], setData);
  } else {
    // Add new set
    exerciseSet.sets.push(setData);
  }

  await workoutSession.save();

  res.json(workoutSession);
});

// @desc Delete a set from an exercise in a workout session
// @route DELETE /api/workout-sessions/:id/exercises/:exerciseIndex/sets/:setNumber
// @access Private
const deleteExerciseSet = asyncHandler(async (req, res) => {
  const { exerciseIndex, setNumber } = req.params;

  const workoutSession = await WorkoutSession.findById(req.params.id);

  if (!workoutSession) {
    res.status(404);
    throw new Error("Workout session not found");
  }

  if (workoutSession.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to modify this workout");
  }

  const exerciseEntry = workoutSession.exercises[exerciseIndex];
  if (!exerciseEntry) {
    res.status(404);
    throw new Error("Exercise not found in session");
  }

  const setIdx = exerciseEntry.sets.findIndex(
    (s) => s.setNumber === Number(setNumber)
  );
  if (setIdx === -1) {
    res.status(404);
    throw new Error("Set not found");
  }

  exerciseEntry.sets.splice(setIdx, 1);
  exerciseEntry.sets.forEach((s, i) => {
    s.setNumber = i + 1;
  });

  await workoutSession.save();
  await workoutSession.populate("exercises.exercise", "name category mainTargetMuscle");

  res.json(workoutSession);
});

// @desc Add exercise to workout session
// @route POST /api/workout-sessions/:id/exercises
// @access Private
const addExerciseToSession = asyncHandler(async (req, res) => {
  const { exerciseId } = req.body;

  const workoutSession = await WorkoutSession.findById(req.params.id);

  if (!workoutSession) {
    res.status(404);
    throw new Error("Workout session not found");
  }

  if (workoutSession.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to modify this workout");
  }

  workoutSession.exercises.push({ exercise: exerciseId, sets: [] });
  await workoutSession.save();
  await workoutSession.populate("exercises.exercise", "name category mainTargetMuscle");

  res.json(workoutSession);
});

// @desc Remove exercise from workout session
// @route DELETE /api/workout-sessions/:id/exercises/:exerciseIndex
// @access Private
const removeExerciseFromSession = asyncHandler(async (req, res) => {
  const { exerciseIndex } = req.params;

  const workoutSession = await WorkoutSession.findById(req.params.id);

  if (!workoutSession) {
    res.status(404);
    throw new Error("Workout session not found");
  }

  if (workoutSession.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to modify this workout");
  }

  if (!workoutSession.exercises[exerciseIndex]) {
    res.status(404);
    throw new Error("Exercise not found in session");
  }

  workoutSession.exercises.splice(Number(exerciseIndex), 1);
  await workoutSession.save();
  await workoutSession.populate("exercises.exercise", "name category mainTargetMuscle");

  res.json(workoutSession);
});

// @desc Get user's workout sessions
// @route GET /api/workout-sessions
// @access Private
const getUserWorkoutSessions = asyncHandler(async (req, res) => {
  const {
    status,
    limit = 20,
    page = 1,
    startDate,
    endDate,
    populate = "true",
    count = "true",
  } = req.query;

  const query = { user: req.user._id };

  if (status) {
    query.status = status;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  let q = WorkoutSession.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  if (populate !== "false") {
    q = q
      .populate("exercises.exercise", "name category mainTargetMuscle")
      .populate("workoutTemplate", "name");
  }

  const workoutSessions = await q;

  const total =
    count !== "false" ? await WorkoutSession.countDocuments(query) : null;

  res.json({
    workoutSessions,
    pagination: {
      currentPage: page,
      totalPages: total !== null ? Math.ceil(total / limit) : null,
      totalWorkouts: total,
    },
  });
});

// @desc Get workout session by ID
// @route GET /api/workout-sessions/:id
// @access Private
const getWorkoutSessionById = asyncHandler(async (req, res) => {
  const workoutSession = await WorkoutSession.findById(req.params.id)
    .populate("exercises.exercise", "name category mainTargetMuscle equipmentNeeded")
    .populate("workoutTemplate", "name description")
    .populate("user", "first_name last_name email");

  if (!workoutSession) {
    res.status(404);
    throw new Error("Workout session not found");
  }

  if (workoutSession.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to view this workout");
  }

  res.json(workoutSession);
});

// @desc Delete workout session
// @route DELETE /api/workout-sessions/:id
// @access Private
const deleteWorkoutSession = asyncHandler(async (req, res) => {
  const workoutSession = await WorkoutSession.findById(req.params.id);

  if (!workoutSession) {
    res.status(404);
    throw new Error("Workout session not found");
  }

  if (workoutSession.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this workout");
  }

  await WorkoutSession.findByIdAndDelete(req.params.id);

  res.json({ message: "Workout session deleted successfully" });
});

// @desc Get workout statistics
// @route GET /api/workout-sessions/stats
// @access Private
const getWorkoutStats = asyncHandler(async (req, res) => {
  const { period = "30d" } = req.query;

  const now = new Date();
  const matchStage = { user: req.user._id, status: "completed" };

  switch (period) {
    case "7d":
      matchStage.completedAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
      break;
    case "30d":
      matchStage.completedAt = { $gte: new Date(now.setDate(now.getDate() - 30)) };
      break;
    case "90d":
      matchStage.completedAt = { $gte: new Date(now.setDate(now.getDate() - 90)) };
      break;
    case "1y":
      matchStage.completedAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
      break;
    case "week": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // back to Monday
      matchStage.completedAt = { $gte: d };
      break;
    }
    case "month": {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      matchStage.completedAt = { $gte: d };
      break;
    }
    case "year": {
      const d = new Date(now.getFullYear(), 0, 1);
      matchStage.completedAt = { $gte: d };
      break;
    }
    // "all" — no completedAt filter
  }

  const stats = await WorkoutSession.aggregate([
    { $match: matchStage },
    {
      $addFields: {
        computedWeight: {
          $reduce: {
            input: "$exercises",
            initialValue: 0,
            in: {
              $add: [
                "$$value",
                {
                  $reduce: {
                    input: "$$this.sets",
                    initialValue: 0,
                    in: {
                      $add: [
                        "$$value",
                        {
                          $cond: [
                            "$$this.completed",
                            {
                              $multiply: [
                                { $ifNull: ["$$this.weight", 0] },
                                { $ifNull: ["$$this.reps", 0] },
                              ],
                            },
                            0,
                          ],
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        totalWorkouts: { $sum: 1 },
        totalSets: { $sum: "$totalSets" },
        totalReps: { $sum: "$totalReps" },
        totalWeight: { $sum: "$computedWeight" },
        avgDuration: { $avg: "$duration" },
        avgRating: { $avg: "$rating" },
        avgRpe: { $avg: "$avgRpe" },
      },
    },
  ]);

  const result = stats[0] || {
    totalWorkouts: 0,
    totalSets: 0,
    totalReps: 0,
    totalWeight: 0,
    avgDuration: 0,
    avgRating: 0,
    avgRpe: 0,
  };

  res.json(result);
});

const MAX_IMPORT_BATCH = 50;

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Find an exercise the user can see by id, then by name; otherwise create it
// as one of the user's custom exercises. Results are cached per request.
const resolveImportedExercise = async (ref, user, cache, createdNames) => {
  const key = ref.id ? `id:${ref.id}` : `name:${ref.name.toLowerCase()}`;
  if (cache.has(key)) return cache.get(key);

  const visible = { $or: [{ user: null }, { isApproved: true }, { user: user._id }] };
  let exercise = null;

  if (ref.id && mongoose.isValidObjectId(ref.id)) {
    exercise = await Exercise.findOne({ _id: ref.id, ...visible });
  }
  if (!exercise && ref.name) {
    exercise = await Exercise.findOne({
      name: new RegExp(`^${escapeRegex(ref.name)}$`, "i"),
      ...visible,
    });
  }
  if (!exercise) {
    if (!ref.name) {
      throw new Error(`Unknown exercise ${ref.id} and no name to create it from`);
    }
    exercise = await Exercise.create({
      user: user._id,
      name: ref.name,
      category: CATEGORIES.includes(ref.category) ? ref.category : undefined,
      difficulty: "beginner",
      duration: 0,
      mainTargetMuscle: ref.mainTargetMuscle || "unknown",
    });
    createdNames.push(exercise.name);
  }

  cache.set(key, exercise._id);
  if (ref.name) cache.set(`name:${ref.name.toLowerCase()}`, exercise._id);
  return exercise._id;
};

// @desc Import workout sessions from a backup file
// @route POST /api/workout-sessions/import
// @access Private
const importWorkoutSessions = asyncHandler(async (req, res) => {
  const { sessions } = req.body;

  if (!Array.isArray(sessions) || sessions.length === 0) {
    res.status(400);
    throw new Error("Expected a non-empty sessions array");
  }
  if (sessions.length > MAX_IMPORT_BATCH) {
    res.status(400);
    throw new Error(`Import at most ${MAX_IMPORT_BATCH} sessions per request`);
  }

  const result = { imported: 0, skipped: [], failed: [], createdExercises: [] };
  const exerciseCache = new Map();

  for (const raw of sessions) {
    let session;
    try {
      session = normaliseImportedSession(raw);
    } catch (err) {
      result.failed.push({ name: raw?.name ?? "(unnamed)", reason: err.message });
      continue;
    }

    const ids = session.originalIds;
    if (ids.length > 0) {
      const objectIds = ids.filter((id) => mongoose.isValidObjectId(id));
      const existing = await WorkoutSession.exists({
        user: req.user._id,
        $or: [{ _id: { $in: objectIds } }, { importedFrom: { $in: ids } }],
      });
      if (existing) {
        result.skipped.push({ name: session.name, reason: "Already exists" });
        continue;
      }
    }

    try {
      const exercises = [];
      for (const ex of session.exercises) {
        exercises.push({
          exercise: await resolveImportedExercise(
            ex.ref,
            req.user,
            exerciseCache,
            result.createdExercises,
          ),
          sets: ex.sets,
          notes: ex.notes,
        });
      }

      const { originalIds, ...fields } = session;
      await WorkoutSession.create({
        ...fields,
        exercises,
        user: req.user._id,
        importedFrom: originalIds[originalIds.length - 1],
      });
      result.imported++;
    } catch (err) {
      result.failed.push({ name: session.name, reason: err.message });
    }
  }

  res.status(201).json(result);
});

// Helper function to check for personal records
const checkForPersonalRecords = async (workoutSession) => {
  for (const exerciseSet of workoutSession.exercises) {
    if (!exerciseSet.sets || exerciseSet.sets.length === 0) continue;

    const completedSets = exerciseSet.sets.filter((set) => set.completed);
    if (completedSets.length === 0) continue;

    const maxWeight = Math.max(...completedSets.map((set) => set.weight || 0));
    const maxReps = Math.max(...completedSets.map((set) => set.reps || 0));
    const totalVolume = completedSets.reduce(
      (sum, set) => sum + (set.weight || 0) * (set.reps || 0),
      0
    );

    // Check for 1RM (estimated using Epley formula: weight * (1 + reps/30))
    const estimated1RM = completedSets.reduce((max, set) => {
      const estimated = (set.weight || 0) * (1 + (set.reps || 0) / 30);
      return Math.max(max, estimated);
    }, 0);

    // Check existing records
    const existing1RM = await PersonalRecord.findOne({
      user: workoutSession.user,
      exercise: exerciseSet.exercise,
      recordType: "1rm",
    });

    const existingMaxWeight = await PersonalRecord.findOne({
      user: workoutSession.user,
      exercise: exerciseSet.exercise,
      recordType: "max-weight",
    });

    const existingMaxVolume = await PersonalRecord.findOne({
      user: workoutSession.user,
      exercise: exerciseSet.exercise,
      recordType: "max-volume",
    });

    // Update or create records if new PRs achieved
    if (!existing1RM || estimated1RM > existing1RM.value) {
      await PersonalRecord.findOneAndUpdate(
        {
          user: workoutSession.user,
          exercise: exerciseSet.exercise,
          recordType: "1rm",
        },
        {
          value: estimated1RM,
          previousRecord: existing1RM
            ? {
                value: existing1RM.value,
                date: existing1RM.achievedDate,
              }
            : null,
          achievedDate: new Date(),
          workoutSession: workoutSession._id,
          improvement: existing1RM
            ? (
                ((estimated1RM - existing1RM.value) / existing1RM.value) *
                100
              ).toFixed(2)
            : 0,
        },
        { upsert: true, new: true }
      );
    }

    if (!existingMaxWeight || maxWeight > existingMaxWeight.value) {
      await PersonalRecord.findOneAndUpdate(
        {
          user: workoutSession.user,
          exercise: exerciseSet.exercise,
          recordType: "max-weight",
        },
        {
          value: maxWeight,
          previousRecord: existingMaxWeight
            ? {
                value: existingMaxWeight.value,
                date: existingMaxWeight.achievedDate,
              }
            : null,
          achievedDate: new Date(),
          workoutSession: workoutSession._id,
          improvement: existingMaxWeight
            ? (
                ((maxWeight - existingMaxWeight.value) /
                  existingMaxWeight.value) *
                100
              ).toFixed(2)
            : 0,
        },
        { upsert: true, new: true }
      );
    }

    if (!existingMaxVolume || totalVolume > existingMaxVolume.value) {
      await PersonalRecord.findOneAndUpdate(
        {
          user: workoutSession.user,
          exercise: exerciseSet.exercise,
          recordType: "max-volume",
        },
        {
          value: totalVolume,
          previousRecord: existingMaxVolume
            ? {
                value: existingMaxVolume.value,
                date: existingMaxVolume.achievedDate,
              }
            : null,
          achievedDate: new Date(),
          workoutSession: workoutSession._id,
          improvement: existingMaxVolume
            ? (
                ((totalVolume - existingMaxVolume.value) /
                  existingMaxVolume.value) *
                100
              ).toFixed(2)
            : 0,
        },
        { upsert: true, new: true }
      );
    }
  }
};

export {
  createWorkoutSession,
  startWorkoutSession,
  completeWorkoutSession,
  updateExerciseSet,
  deleteExerciseSet,
  addExerciseToSession,
  removeExerciseFromSession,
  getUserWorkoutSessions,
  getWorkoutSessionById,
  deleteWorkoutSession,
  getWorkoutStats,
  importWorkoutSessions,
};
