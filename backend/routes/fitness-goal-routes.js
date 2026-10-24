import express from "express";
const router = express.Router();
import asyncHandler from "../middleware/async-handler.js";
import FitnessGoal from "../models/fitness-goal-model.js";
import { protect } from "../middleware/auth-middleware.js";
import pickFields from "../utils/pick-fields.js";

router.use(protect);

const EDITABLE_FIELDS = [
  "title",
  "description",
  "goalType",
  "targetValue",
  "targetUnit",
  "currentValue",
  "exercise",
  "targetDate",
  "startDate",
  "completedDate",
  "status",
  "progress",
  "priority",
  "reward",
  "milestones",
  "notes",
  "tags",
];

// @desc Create fitness goal
// @route POST /api/fitness-goals
// @access Private
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const goal = await FitnessGoal.create({
      ...pickFields(req.body, EDITABLE_FIELDS),
      user: req.user._id,
    });

    await goal.populate("exercise", "name category mainTargetMuscle");

    res.status(201).json(goal);
  })
);

// @desc Get user's fitness goals
// @route GET /api/fitness-goals
// @access Private
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, goalType } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;
    if (goalType) query.goalType = goalType;

    const goals = await FitnessGoal.find(query)
      .populate("exercise", "name category mainTargetMuscle")
      .sort({ priority: -1, targetDate: 1 });

    res.json(goals);
  })
);

// @desc Get goal by ID
// @route GET /api/fitness-goals/:id
// @access Private
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const goal = await FitnessGoal.findById(req.params.id).populate(
      "exercise",
      "name category mainTargetMuscle"
    );

    if (!goal) {
      res.status(404);
      throw new Error("Goal not found");
    }

    if (goal.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to view this goal");
    }

    res.json(goal);
  })
);

// @desc Update goal
// @route PUT /api/fitness-goals/:id
// @access Private
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const goal = await FitnessGoal.findById(req.params.id);

    if (!goal) {
      res.status(404);
      throw new Error("Goal not found");
    }

    if (goal.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to update this goal");
    }

    Object.assign(goal, pickFields(req.body, EDITABLE_FIELDS));

    // Update progress if currentValue changed
    if (goal.targetValue && goal.currentValue !== undefined) {
      goal.progress = Math.min(
        100,
        (goal.currentValue / goal.targetValue) * 100
      );

      // Mark as completed if target reached
      if (goal.progress >= 100 && goal.status === "active") {
        goal.status = "completed";
        goal.completedDate = new Date();
      }
    }

    await goal.save();
    await goal.populate("exercise", "name category mainTargetMuscle");

    res.json(goal);
  })
);

// @desc Delete goal
// @route DELETE /api/fitness-goals/:id
// @access Private
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const goal = await FitnessGoal.findById(req.params.id);

    if (!goal) {
      res.status(404);
      throw new Error("Goal not found");
    }

    if (goal.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to delete this goal");
    }

    await FitnessGoal.findByIdAndDelete(req.params.id);

    res.json({ message: "Goal deleted successfully" });
  })
);

// @desc Add milestone to goal
// @route POST /api/fitness-goals/:id/milestones
// @access Private
router.post(
  "/:id/milestones",
  asyncHandler(async (req, res) => {
    const goal = await FitnessGoal.findById(req.params.id);

    if (!goal) {
      res.status(404);
      throw new Error("Goal not found");
    }

    if (goal.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to modify this goal");
    }

    goal.milestones.push(req.body);
    await goal.save();

    res.json(goal);
  })
);

// @desc Mark milestone as achieved
// @route PUT /api/fitness-goals/:id/milestones/:milestoneId/achieve
// @access Private
router.put(
  "/:id/milestones/:milestoneId/achieve",
  asyncHandler(async (req, res) => {
    const goal = await FitnessGoal.findById(req.params.id);

    if (!goal) {
      res.status(404);
      throw new Error("Goal not found");
    }

    if (goal.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to modify this goal");
    }

    const milestone = goal.milestones.id(req.params.milestoneId);
    if (!milestone) {
      res.status(404);
      throw new Error("Milestone not found");
    }

    milestone.achieved = true;
    milestone.achievedDate = new Date();

    await goal.save();

    res.json(goal);
  })
);

export default router;
