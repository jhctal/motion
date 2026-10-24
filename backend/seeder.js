import mongoose from "mongoose";
import colors from "colors";
import dotenv from "dotenv";
dotenv.config({ path: "../.env.development" });

import users from "./data/users.js";
import exercises from "./data/exercises.js";
import workouts from "./data/workouts.js";
import templateExercises from "./data/template-exercises.js";
import exerciseImages from "./data/exercise-images.js";
import User from "./models/user-model.js";
import Exercise from "./models/exercise-model.js";
import WorkoutTemplate from "./models/workout-template-model.js";
import TemplateExercise from "./models/template-exercise-model.js";
import connectDB from "./config/db.js";


// Start/finish photo paths for an exercise, from data/exercise-images.js
const imagesFor = (name) => {
  const id = exerciseImages[name];
  return id
    ? [`/exercise-images/${id}/0.jpg`, `/exercise-images/${id}/1.jpg`]
    : [];
};
const withImages = (exercise) => ({
  ...exercise,
  images: imagesFor(exercise.name),
});

const importData = async () => {
  try {
    await User.deleteMany();
    await Exercise.deleteMany();
    await WorkoutTemplate.deleteMany();
    await TemplateExercise.deleteMany();

    const createdUsers = await User.insertMany(users);
    const adminUser = createdUsers[0]._id;

    const createdExercises = await Exercise.insertMany(
      exercises.map(withImages)
    );

    const exerciseMap = {};
    createdExercises.forEach((exercise) => {
      exerciseMap[exercise.name] = exercise._id;
    });

    const sampleWorkouts = workouts.map((workout) => {
      return {
        ...workout,
        user: adminUser,
      };
    });

    const createdWorkouts = await WorkoutTemplate.insertMany(sampleWorkouts);

    const workoutMap = {};
    createdWorkouts.forEach((workout) => {
      workoutMap[workout.name] = workout._id;
    });

    const templateExercisesList = [];
    for (const [workoutName, exercises] of Object.entries(templateExercises)) {
      const workoutId = workoutMap[workoutName];
      if (workoutId) {
        exercises.forEach((exercise) => {
          const exerciseId = exerciseMap[exercise.exerciseName];
          if (exerciseId) {
            templateExercisesList.push({
              workoutTemplate: workoutId,
              exercise: exerciseId,
              orderIndex: exercise.orderIndex,
              targetSets: exercise.targetSets,
              targetReps: exercise.targetReps,
              targetWeight: exercise.targetWeight,
              targetDurationSeconds: exercise.targetDurationSeconds,
              restSeconds: exercise.restSeconds,
              notes: exercise.notes,
            });
          }
        });
      }
    }

    await TemplateExercise.insertMany(templateExercisesList);

    console.log("Data Imported!".green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    await Exercise.deleteMany();
    await WorkoutTemplate.deleteMany();
    await TemplateExercise.deleteMany();

    console.log("Data Destroyed!".red.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

const upsertExercises = async () => {
  try {
    let inserted = 0;
    let skipped = 0;
    for (const exercise of exercises) {
      const result = await Exercise.updateOne(
        { name: exercise.name },
        { $setOnInsert: withImages(exercise) },
        { upsert: true }
      );
      if (result.upsertedCount > 0) {
        inserted++;
      } else {
        skipped++;
      }
    }
    console.log(`Exercises seeded: ${inserted} inserted, ${skipped} already existed.`.green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

// Sets photos on exercises already in the database, matched by name.
// Leaves everything else alone; safe to run repeatedly.
const updateExerciseImages = async () => {
  try {
    let updated = 0;
    let missing = 0;
    for (const exercise of exercises) {
      const result = await Exercise.updateOne(
        { name: exercise.name },
        { $set: { images: imagesFor(exercise.name) } }
      );
      if (result.matchedCount === 0) missing++;
      else if (result.modifiedCount > 0) updated++;
    }
    console.log(
      `Exercise images: ${updated} updated, ${missing} not in database.`.green
        .inverse
    );
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

const upsertTemplateExercises = async () => {
  try {
    let inserted = 0;
    let skipped = 0;
    let missing = [];

    for (const [workoutName, entries] of Object.entries(templateExercises)) {
      const template = await WorkoutTemplate.findOne({ name: workoutName });
      if (!template) {
        console.log(`Template not found: "${workoutName}" — skipping`.yellow);
        continue;
      }

      for (const entry of entries) {
        const exercise = await Exercise.findOne({ name: entry.exerciseName });
        if (!exercise) {
          missing.push(entry.exerciseName);
          continue;
        }

        const exists = await TemplateExercise.findOne({
          workoutTemplate: template._id,
          exercise: exercise._id,
        });

        if (exists) {
          skipped++;
        } else {
          await TemplateExercise.create({
            workoutTemplate: template._id,
            exercise: exercise._id,
            orderIndex: entry.orderIndex,
            targetSets: entry.targetSets,
            targetReps: entry.targetReps,
            targetWeight: entry.targetWeight,
            targetDurationSeconds: entry.targetDurationSeconds,
            restSeconds: entry.restSeconds,
            notes: entry.notes,
          });
          inserted++;
        }
      }
    }

    if (missing.length) {
      console.log(`Exercises not found in DB: ${missing.join(", ")}`.yellow);
    }
    console.log(`Template exercises seeded: ${inserted} inserted, ${skipped} already existed.`.green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

// Destructive commands need an explicit flag; running with no flag (or an
// unknown one) only prints usage, so a typo can't wipe the database.
const commands = {
  "--reset": [importData, "DELETE all users, exercises and templates, then re-seed"],
  "--destroy": [destroyData, "DELETE all users, exercises and templates"],
  "--exercises-only": [upsertExercises, "insert seed exercises that are missing"],
  "--exercise-images": [updateExerciseImages, "set photos on existing exercises"],
  "--templates-only": [upsertTemplateExercises, "insert missing template exercises"],
};

const command = commands[process.argv[2]];
if (command) {
  connectDB();
  command[0]();
} else {
  console.log("Usage: node seeder.js <flag>\n");
  for (const [flag, [, description]] of Object.entries(commands)) {
    console.log(`  ${flag.padEnd(20)} ${description}`);
  }
  process.exit(1);
}
