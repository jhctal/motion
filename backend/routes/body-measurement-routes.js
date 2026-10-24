import express from "express";
const router = express.Router();
import asyncHandler from "../middleware/async-handler.js";
import BodyMeasurement from "../models/body-measurement-model.js";
import { protect } from "../middleware/auth-middleware.js";
import pickFields from "../utils/pick-fields.js";

router.use(protect);

// previousValue, change and changePercent are calculated on save
const EDITABLE_FIELDS = [
  "measurementType",
  "value",
  "unit",
  "measuredDate",
  "timeOfDay",
  "conditions",
  "notes",
  "photoUrl",
];

// @desc Add body measurement
// @route POST /api/body-measurements
// @access Private
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const measurement = await BodyMeasurement.create({
      ...pickFields(req.body, EDITABLE_FIELDS),
      user: req.user._id,
    });

    res.status(201).json(measurement);
  })
);

// @desc Get user's body measurements
// @route GET /api/body-measurements
// @access Private
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { measurementType, startDate, endDate, limit = 50 } = req.query;

    const query = { user: req.user._id };
    if (measurementType) query.measurementType = measurementType;

    if (startDate || endDate) {
      query.measuredDate = {};
      if (startDate) query.measuredDate.$gte = new Date(startDate);
      if (endDate) query.measuredDate.$lte = new Date(endDate);
    }

    const measurements = await BodyMeasurement.find(query)
      .sort({ measuredDate: -1 })
      .limit(parseInt(limit));

    res.json(measurements);
  })
);

// @desc Get measurement by ID
// @route GET /api/body-measurements/:id
// @access Private
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const measurement = await BodyMeasurement.findById(req.params.id);

    if (!measurement) {
      res.status(404);
      throw new Error("Measurement not found");
    }

    if (measurement.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to view this measurement");
    }

    res.json(measurement);
  })
);

// @desc Update measurement
// @route PUT /api/body-measurements/:id
// @access Private
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const measurement = await BodyMeasurement.findById(req.params.id);

    if (!measurement) {
      res.status(404);
      throw new Error("Measurement not found");
    }

    if (measurement.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to update this measurement");
    }

    Object.assign(measurement, pickFields(req.body, EDITABLE_FIELDS));
    await measurement.save();

    res.json(measurement);
  })
);

// @desc Delete measurement
// @route DELETE /api/body-measurements/:id
// @access Private
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const measurement = await BodyMeasurement.findById(req.params.id);

    if (!measurement) {
      res.status(404);
      throw new Error("Measurement not found");
    }

    if (measurement.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to delete this measurement");
    }

    await BodyMeasurement.findByIdAndDelete(req.params.id);

    res.json({ message: "Measurement deleted successfully" });
  })
);

// @desc Get measurement trends
// @route GET /api/body-measurements/trends/:measurementType
// @access Private
router.get(
  "/trends/:measurementType",
  asyncHandler(async (req, res) => {
    const { measurementType } = req.params;
    const { period = "6m" } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case "1m":
        dateFilter = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
        break;
      case "3m":
        dateFilter = { $gte: new Date(now.setMonth(now.getMonth() - 3)) };
        break;
      case "6m":
        dateFilter = { $gte: new Date(now.setMonth(now.getMonth() - 6)) };
        break;
      case "1y":
        dateFilter = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
        break;
    }

    const measurements = await BodyMeasurement.find({
      user: req.user._id,
      measurementType,
      measuredDate: dateFilter,
    }).sort({ measuredDate: 1 });

    // Calculate trend data
    const trendData = measurements.map((measurement, index) => ({
      date: measurement.measuredDate,
      value: measurement.value,
      change: measurement.change || 0,
      changePercent: measurement.changePercent || 0,
    }));

    const latest = measurements[measurements.length - 1];
    const earliest = measurements[0];
    const totalChange = latest && earliest ? latest.value - earliest.value : 0;
    const totalChangePercent =
      latest && earliest
        ? ((totalChange / earliest.value) * 100).toFixed(2)
        : 0;

    res.json({
      measurementType,
      period,
      data: trendData,
      summary: {
        latest: latest?.value || 0,
        earliest: earliest?.value || 0,
        totalChange,
        totalChangePercent,
        dataPoints: measurements.length,
      },
    });
  })
);

export default router;
