import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isApproved: { type: Boolean, default: false },
    name: { type: String, required: true },
    description: String,
    image: String,
    // start and finish photos, e.g. /exercise-images/Pushups/0.jpg
    images: [String],
    category: {
      type: String,
      enum: ["strength", "cardio", "flexibility", "balance", "sports"],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["beginner", "intermediate", "advanced"],
    },
    duration: { type: Number, required: true },
    mainTargetMuscle: { type: String, required: true },
    muscleGroups: [String],
    equipmentNeeded: [String],
    instructions: String,
    isCompound: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Exercise = mongoose.model("Exercise", exerciseSchema);

export default Exercise;
