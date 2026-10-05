import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useListExercises } from "../../api/exercises/use-list-exercises";
import { useAddExerciseToWorkout } from "../../api/workouts/use-add-exercise-to-workout";
import { useCreateWorkout } from "../../api/workouts/use-create-workout";
import ExerciseOptGroups from "../../ui/exercise-opt-groups";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";

export const Route = createFileRoute("/workouts/new")({
  beforeLoad: async ({ location }) => {
    const user = localStorage.getItem("user");
    if (!user) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }
  },
  component: NewWorkout,
});

const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

type SelectedExercise = {
  uid: string;
  exerciseId: string;
  name: string;
  mainTargetMuscle: string;
};

function NewWorkout() {
  const navigate = useNavigate();
  const createWorkout = useCreateWorkout();
  const addExercise = useAddExerciseToWorkout();
  const { data: allExercises } = useListExercises();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState<string>("beginner");
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<
    SelectedExercise[]
  >([]);

  const availableExercises = allExercises?.filter(
    (ex) => !selectedExercises.some((sel) => sel.exerciseId === ex._id),
  );

  function handleAddExercise(exerciseId: string) {
    const exercise = allExercises?.find((ex) => ex._id === exerciseId);
    if (!exercise) return;
    setSelectedExercises((prev) => [
      ...prev,
      {
        uid: crypto.randomUUID(),
        exerciseId: exercise._id,
        name: exercise.name,
        mainTargetMuscle: exercise.mainTargetMuscle,
      },
    ]);
  }

  function removeExercise(uid: string) {
    setSelectedExercises((prev) => prev.filter((ex) => ex.uid !== uid));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const workout = await createWorkout.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      difficultyLevel: difficultyLevel as
        | "beginner"
        | "intermediate"
        | "advanced",
      estimatedDurationMinutes: estimatedDurationMinutes
        ? Number(estimatedDurationMinutes)
        : undefined,
    });

    for (const ex of selectedExercises) {
      await addExercise.mutateAsync({
        workoutId: workout._id,
        exerciseId: ex.exerciseId,
      });
    }

    navigate({ to: "/workouts/$id", params: { id: workout._id } });
  }

  const isSubmitting = createWorkout.isPending || addExercise.isPending;

  return (
    <PageWrapper pageName="New workout">
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl flex flex-col gap-5 mt-2"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Push day"
            className="w-full p-2 border rounded bg-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full p-2 border rounded bg-transparent resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <select
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value)}
              className="w-full p-2 border rounded bg-transparent capitalize"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d} className="capitalize">
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Estimated duration (mins)
            </label>
            <input
              type="number"
              min={1}
              value={estimatedDurationMinutes}
              onChange={(e) => setEstimatedDurationMinutes(e.target.value)}
              placeholder="e.g. 60"
              className="w-full p-2 border rounded bg-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Exercises</label>
          <select
            value=""
            onChange={(e) => handleAddExercise(e.target.value)}
            className="w-full p-2 border rounded bg-transparent capitalize"
            disabled={!availableExercises || availableExercises.length === 0}
          >
            <option value="">
              {!availableExercises || availableExercises.length === 0
                ? "— no more exercises —"
                : "— add an exercise —"}
            </option>
            {availableExercises && (
              <ExerciseOptGroups exercises={availableExercises} />
            )}
          </select>

          {selectedExercises.length > 0 && (
            <div className="flex flex-col gap-2 mt-3">
              {selectedExercises.map((ex, i) => (
                <div
                  key={ex.uid}
                  className="border rounded p-3 flex items-center gap-3"
                >
                  <span className="text-gray-400 dark:text-gray-300 text-sm w-5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium capitalize text-sm truncate">
                      {ex.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-300 capitalize">
                      {ex.mainTargetMuscle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExercise(ex.uid)}
                    className="text-gray-400 dark:text-gray-300 hover:text-red-400 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="w-full py-3 bg-orange-500 text-black font-semibold rounded hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "Create workout"}
        </button>
      </form>
    </PageWrapper>
  );
}
