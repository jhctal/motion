import asyncHandler from "../middleware/async-handler.js";
import Workout from "../models/workout-template-model.js";
import TemplateExercise from "../models/template-exercise-model.js";
import { appendWorkoutToSeeder } from "../utils/append-to-workouts-data.js";

// @desc Fetch all approved workouts
// @route GET /api/workouts
// @access Public
const getWorkouts = asyncHandler(async (req, res) => {
  const workouts = await Workout.find({ isApproved: true });

  const exercises = await TemplateExercise.find({
    workoutTemplate: { $in: workouts.map((w) => w._id) },
  })
    .populate("exercise", "name category mainTargetMuscle")
    .sort({ orderIndex: 1 });

  const workoutsWithExercises = workouts.map((workout) => ({
    ...workout.toObject(),
    exercises: exercises.filter(
      (ex) => ex.workoutTemplate.toString() === workout._id.toString()
    ),
  }));

  res.json(workoutsWithExercises);
});

// @desc Fetch a workout with its exercises
// @route GET /api/workouts/:id
// @access Public
const getWorkoutById = asyncHandler(async (req, res) => {
  const workout = await Workout.findById(req.params.id);
  if (!workout) {
    res.status(404);
    throw new Error("Workout not found");
  }

  const exercises = await TemplateExercise.find({
    workoutTemplate: workout._id,
  })
    .populate(
      "exercise",
      "name category difficulty mainTargetMuscle muscleGroups equipmentNeeded isCompound image images"
    )
    .sort({ orderIndex: 1 });

  res.json({ ...workout.toObject(), exercises });
});

// @desc Create a new workout template
// @route POST /api/workouts
// @access Private
const createWorkout = asyncHandler(async (req, res) => {
  const { name, description, difficultyLevel, estimatedDurationMinutes, isPublic } = req.body;

  const workout = await Workout.create({
    user: req.user._id,
    name,
    description,
    difficultyLevel,
    estimatedDurationMinutes,
    isPublic: isPublic || false,
  });

  res.status(201).json({ ...workout.toObject(), exercises: [] });
});

// @desc Add an exercise to a workout template
// @route POST /api/workouts/:id/exercises
// @access Private
const addExerciseToWorkout = asyncHandler(async (req, res) => {
  const workout = await Workout.findById(req.params.id);
  if (!workout) {
    res.status(404);
    throw new Error("Workout not found");
  }
  if (workout.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }

  const existingCount = await TemplateExercise.countDocuments({
    workoutTemplate: workout._id,
  });

  const { exerciseId, targetSets, targetReps, targetWeight, targetDurationSeconds, restSeconds, notes } = req.body;

  const templateExercise = await TemplateExercise.create({
    workoutTemplate: workout._id,
    exercise: exerciseId,
    orderIndex: existingCount,
    targetSets,
    targetReps,
    targetWeight,
    targetDurationSeconds,
    restSeconds,
    notes,
  });

  await templateExercise.populate("exercise", "name category mainTargetMuscle");

  res.status(201).json(templateExercise);
});

// @desc Update a workout template
// @route PUT /api/workouts/:id
// @access Private/Admin
const updateWorkout = asyncHandler(async (req, res) => {
  const workout = await Workout.findById(req.params.id);
  if (!workout) {
    res.status(404);
    throw new Error("Workout not found");
  }

  const { name, description, difficultyLevel, estimatedDurationMinutes, isPublic } = req.body;

  if (name !== undefined) workout.name = name;
  if (description !== undefined) workout.description = description;
  if (difficultyLevel !== undefined) workout.difficultyLevel = difficultyLevel;
  if (estimatedDurationMinutes !== undefined) workout.estimatedDurationMinutes = estimatedDurationMinutes;
  if (isPublic !== undefined) workout.isPublic = isPublic;

  await workout.save();

  const exercises = await TemplateExercise.find({ workoutTemplate: workout._id })
    .populate("exercise", "name category difficulty mainTargetMuscle muscleGroups equipmentNeeded isCompound image images")
    .sort({ orderIndex: 1 });

  res.json({ ...workout.toObject(), exercises });
});

// @desc Remove an exercise from a workout template
// @route DELETE /api/workouts/:id/exercises/:teId
// @access Private/Admin
const removeExerciseFromWorkout = asyncHandler(async (req, res) => {
  const te = await TemplateExercise.findById(req.params.teId);
  if (!te || te.workoutTemplate.toString() !== req.params.id) {
    res.status(404);
    throw new Error("Exercise not found on this workout");
  }

  await te.deleteOne();

  // Re-index remaining exercises so orderIndex stays contiguous
  const remaining = await TemplateExercise.find({ workoutTemplate: req.params.id }).sort({ orderIndex: 1 });
  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].orderIndex !== i) {
      remaining[i].orderIndex = i;
      await remaining[i].save();
    }
  }

  res.json({ message: "Exercise removed" });
});

// @desc Fetch workouts pending admin approval
// @route GET /api/workouts/pending
// @access Private/Admin
const getPendingWorkouts = asyncHandler(async (req, res) => {
  const workouts = await Workout.find({ isApproved: false }).populate(
    "user",
    "first_name last_name email"
  );

  const exercises = await TemplateExercise.find({
    workoutTemplate: { $in: workouts.map((w) => w._id) },
  })
    .populate("exercise", "name category mainTargetMuscle")
    .sort({ orderIndex: 1 });

  const workoutsWithExercises = workouts.map((workout) => ({
    ...workout.toObject(),
    exercises: exercises.filter(
      (ex) => ex.workoutTemplate.toString() === workout._id.toString()
    ),
  }));

  res.json(workoutsWithExercises);
});

// @desc Approve a user-submitted workout and append it to the seeder
// @route PUT /api/workouts/:id/approve
// @access Private/Admin
const approveWorkout = asyncHandler(async (req, res) => {
  const workout = await Workout.findById(req.params.id);
  if (!workout) {
    res.status(404);
    throw new Error("Workout not found");
  }

  workout.isApproved = true;
  await workout.save();

  const templateExercises = await TemplateExercise.find({
    workoutTemplate: workout._id,
  })
    .populate("exercise", "name")
    .sort({ orderIndex: 1 });

  const exercisesForSeeder = templateExercises.map((te) => ({
    exerciseName: te.exercise.name,
    orderIndex: te.orderIndex,
    targetSets: te.targetSets,
    targetReps: te.targetReps,
    targetWeight: te.targetWeight,
    targetDurationSeconds: te.targetDurationSeconds,
    restSeconds: te.restSeconds,
  }));

  try {
    appendWorkoutToSeeder(workout.toObject(), exercisesForSeeder);
  } catch (err) {
    console.error("Warning: could not write to workout data files —", err.message);
  }

  res.json({ ...workout.toObject(), exercises: templateExercises });
});

// @desc Delete a pending or approved user-submitted workout
// @route DELETE /api/workouts/:id
// @access Private/Admin
const deleteWorkout = asyncHandler(async (req, res) => {
  const workout = await Workout.findById(req.params.id);
  if (!workout) {
    res.status(404);
    throw new Error("Workout not found");
  }

  await TemplateExercise.deleteMany({ workoutTemplate: workout._id });
  await workout.deleteOne();

  res.json({ message: "Workout removed" });
});

export {
  getWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  getPendingWorkouts,
  approveWorkout,
  deleteWorkout,
};
