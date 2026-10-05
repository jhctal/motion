import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useListExercises } from "../../api/exercises/use-list-exercises";
import useListWorkouts from "../../api/workouts/use-list-workouts";
import {
  useCreateWorkoutSession,
  useStartWorkoutSession,
} from "../../api/workouts/use-workout-sessions";
import ExerciseOptGroups from "../../ui/exercise-opt-groups";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";

export const Route = createFileRoute("/my-logs/new")({
  beforeLoad: async () => {
    const user = localStorage.getItem("user");
    if (!user) {
      throw redirect({ to: "/auth" });
    }
  },
  component: NewLog,
});

type SessionExercise = {
  uid: string;
  exerciseId: string;
  name: string;
  category: string;
  mainTargetMuscle: string;
};

function NewLog() {
  const navigate = useNavigate();

  const { data: workouts } = useListWorkouts();
  const { data: allExercises } = useListExercises();

  const createSession = useCreateWorkoutSession();
  const startSession = useStartWorkoutSession();

  const [sessionName, setSessionName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<SessionExercise[]>(
    [],
  );

  function handleTemplateChange(templateId: string) {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setSelectedExercises([]);
      setSessionName("");
      return;
    }
    const template = workouts?.find((w) => w._id === templateId);
    if (!template) return;

    setSessionName(template.name);
    const exercises: SessionExercise[] = template.exercises
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((te) => ({
        uid: crypto.randomUUID(),
        exerciseId: te.exercise._id,
        name: te.exercise.name,
        category: te.exercise.category ?? "strength",
        mainTargetMuscle: te.exercise.mainTargetMuscle,
      }));
    setSelectedExercises(exercises);
  }

  function handleAddExercise(exerciseId: string) {
    const exercise = allExercises?.find((ex) => ex._id === exerciseId);
    if (!exercise) return;
    setSelectedExercises((prev) => [
      ...prev,
      {
        uid: crypto.randomUUID(),
        exerciseId: exercise._id,
        name: exercise.name,
        category: exercise.category ?? "strength",
        mainTargetMuscle: exercise.mainTargetMuscle,
      },
    ]);
  }

  function removeExercise(uid: string) {
    setSelectedExercises((prev) => prev.filter((ex) => ex.uid !== uid));
  }

  const availableExercises = allExercises?.filter(
    (ex) => !selectedExercises.some((sel) => sel.exerciseId === ex._id),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (selectedExercises.length === 0) return;

    const name = sessionName.trim() || new Date().toLocaleDateString();

    const sessionExercises = selectedExercises.map((se) => ({
      exercise: se.exerciseId,
      sets: [],
    }));

    const session = await createSession.mutateAsync({
      name,
      basedOnWorkout: selectedTemplateId || undefined,
      exercises: sessionExercises,
    });

    await startSession.mutateAsync(session._id);
    navigate({ to: "/my-logs/$id", params: { id: session._id } });
  }

  const isSubmitting = createSession.isPending || startSession.isPending;

  return (
    <PageWrapper pageName="New workout">
      <form onSubmit={handleSubmit} className="max-w-2xl flex flex-col gap-6">
        {/* Session name */}
        <div>
          <label className="block text-sm font-medium mb-1">Workout name</label>
          <input
            type="text"
            placeholder="e.g. Push Day"
            className="w-full p-2 border rounded bg-transparent"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
          />
        </div>

        {/* Template picker */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Start from a template (optional)
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full p-2 border rounded bg-transparent capitalize"
          >
            <option value="">— no template —</option>
            {workouts?.map((w) => (
              <option key={w._id} value={w._id} className="capitalize">
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Exercise picker — all exercises */}
        <div className="flex flex-col gap-3">
          <label className="block text-sm font-medium">Exercises</label>
          <select
            value=""
            onChange={(e) => handleAddExercise(e.target.value)}
            className="w-full p-2 border rounded bg-transparent capitalize"
            disabled={!availableExercises || availableExercises.length === 0}
          >
            <option value="">
              {!availableExercises || availableExercises.length === 0
                ? "— all exercises added —"
                : "— add an exercise —"}
            </option>
            {availableExercises && (
              <ExerciseOptGroups exercises={availableExercises} />
            )}
          </select>

          {selectedExercises.length > 0 && (
            <div className="flex flex-col gap-2">
              {selectedExercises.map((exercise) => (
                <div
                  key={exercise.uid}
                  className="border rounded p-3 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium capitalize text-sm truncate">
                      {exercise.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-300 capitalize">
                      {exercise.mainTargetMuscle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExercise(exercise.uid)}
                    className="text-gray-400 dark:text-gray-300 hover:text-red-400 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedExercises.length === 0 && (
            <p className="text-gray-400 dark:text-gray-300 text-sm py-6 text-center border rounded">
              Add at least one exercise to start
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || selectedExercises.length === 0}
          className="w-full py-3 bg-orange-500 text-black font-semibold rounded hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Starting..." : "Start workout"}
        </button>
      </form>
    </PageWrapper>
  );
}
