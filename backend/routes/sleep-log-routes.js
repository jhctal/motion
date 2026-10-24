import express from "express";
const router = express.Router();
import asyncHandler from "../middleware/async-handler.js";
import SleepLog from "../models/sleep-log-model.js";
import { protect } from "../middleware/auth-middleware.js";
import pickFields from "../utils/pick-fields.js";

router.use(protect);

// durationMinutes is calculated on save
const EDITABLE_FIELDS = ["date", "bedTime", "wakeTime", "quality", "notes"];

// @desc Log sleep
// @route POST /api/sleep-logs
// @access Private
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const log = await SleepLog.create({
      ...pickFields(req.body, EDITABLE_FIELDS),
      user: req.user._id,
    });
    res.status(201).json(log);
  })
);

// @desc Get user's sleep logs
// @route GET /api/sleep-logs
// @access Private
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { startDate, endDate, limit = 30 } = req.query;

    const query = { user: req.user._id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const logs = await SleepLog.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json(logs);
  })
);

// @desc Get sleep log by ID
// @route GET /api/sleep-logs/:id
// @access Private
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const log = await SleepLog.findById(req.params.id);

    if (!log) {
      res.status(404);
      throw new Error("Sleep log not found");
    }
    if (log.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized");
    }

    res.json(log);
  })
);

// @desc Update sleep log
// @route PUT /api/sleep-logs/:id
// @access Private
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const log = await SleepLog.findById(req.params.id);

    if (!log) {
      res.status(404);
      throw new Error("Sleep log not found");
    }
    if (log.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized");
    }

    Object.assign(log, pickFields(req.body, EDITABLE_FIELDS));
    await log.save();
    res.json(log);
  })
);

// @desc Delete sleep log
// @route DELETE /api/sleep-logs/:id
// @access Private
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const log = await SleepLog.findById(req.params.id);

    if (!log) {
      res.status(404);
      throw new Error("Sleep log not found");
    }
    if (log.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized");
    }

    await SleepLog.findByIdAndDelete(req.params.id);
    res.json({ message: "Sleep log deleted" });
  })
);

export default router;
