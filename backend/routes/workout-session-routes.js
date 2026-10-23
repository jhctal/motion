import express from "express";
const router = express.Router();
import {
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
} from "../controllers/workout-session-controller.js";
import { protect } from "../middleware/auth-middleware.js";

// All routes are protected
router.use(protect);

router.route("/").get(getUserWorkoutSessions).post(createWorkoutSession);

router.route("/stats").get(getWorkoutStats);

router.route("/import").post(importWorkoutSessions);

router.route("/:id").get(getWorkoutSessionById).delete(deleteWorkoutSession);

router.route("/:id/start").put(startWorkoutSession);

router.route("/:id/complete").put(completeWorkoutSession);

router.route("/:id/exercises").post(addExerciseToSession);
router.route("/:id/exercises/:exerciseIndex").delete(removeExerciseFromSession);
router.route("/:id/exercises/:exerciseIndex/sets").put(updateExerciseSet);
router
  .route("/:id/exercises/:exerciseIndex/sets/:setNumber")
  .delete(deleteExerciseSet);

export default router;
