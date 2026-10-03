import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import useUserProfile from "../../api/user/use-user-profile";
import { useListExercises } from "../../api/exercises/use-list-exercises";
import { useAddExerciseToWorkout } from "../../api/workouts/use-add-exercise-to-workout";
import { useDeleteWorkout } from "../../api/workouts/use-delete-workout";
import useFindWorkout from "../../api/workouts/use-find-workout";
import { useRemoveExerciseFromWorkout } from "../../api/workouts/use-remove-exercise-from-workout";
import { useUpdateWorkout } from "../../api/workouts/use-update-workout";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";

export const Route = createFileRoute("/workouts/$id")({
  beforeLoad: async ({ location }) => {
    const user = localStorage.getItem("user");
    if (!user) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }
  },
  component: WorkoutView,
});

const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

function WorkoutView() {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const { data } = useFindWorkout(id ?? "");
  const { data: profile } = useUserProfile();
  const { data: allExercises } = useListExercises();

  const updateWorkout = useUpdateWorkout();
  const deleteWorkout = useDeleteWorkout();
  const addExercise = useAddExerciseToWorkout();
  const removeExercise = useRemoveExerciseFromWorkout();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("beginner");
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState("");

  useEffect(() => {
    if (data) {
      setName(data.name ?? "");
      setDescription(data.description ?? "");
      setDifficultyLevel(data.difficultyLevel ?? "beginner");
      setEstimatedDurationMinutes(String(data.estimatedDurationMinutes ?? ""));
    }
  }, [data]);

  const isAdmin = profile?.isAdmin ?? false;

  async function handleSave() {
    if (!id) return;
    await updateWorkout.mutateAsync({
      id,
      name: name.trim(),
      description: description.trim(),
      difficultyLevel: difficultyLevel as
        | "beginner"
        | "intermediate"
        | "advanced",
      estimatedDurationMinutes: estimatedDurationMinutes
        ? Number(estimatedDurationMinutes)
        : undefined,
    });
    setEditing(false);
  }

  async function handleDelete() {
    if (!id || !confirm(`Delete "${data?.name}"? This cannot be undone.`))
      return;
    await deleteWorkout.mutateAsync(id);
    navigate({ to: "/workouts" });
  }

  async function handleAddExercise(exerciseId: string) {
    if (!id || !exerciseId) return;
    await addExercise.mutateAsync({ workoutId: id, exerciseId });
  }

  async function handleRemoveExercise(templateExerciseId: string) {
    if (!id) return;
    await removeExercise.mutateAsync({ workoutId: id, templateExerciseId });
  }

  const existingExerciseIds = new Set(
    data?.exercises.map((e) => e.exercise._id) ?? [],
  );
  const availableToAdd = allExercises?.filter(
    (ex) => !existingExerciseIds.has(ex._id),
  );

  return (
    <PageWrapper pageName={editing ? "" : (data?.name ?? "Loading...")}>
      <div className="flex flex-col gap-4 w-full">
        {/* Admin toolbar */}
        {isAdmin && !editing && (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1 border rounded text-sm hover:bg-orange-500 hover:text-black hover:border-orange-500"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteWorkout.isPending}
              className="px-3 py-1 border border-red-500 text-red-500 text-sm rounded hover:bg-red-500 hover:text-black disabled:opacity-40"
            >
              {deleteWorkout.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}

        {/* Edit form */}
        {editing ? (
          <div className="flex flex-col gap-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded bg-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full p-2 border rounded bg-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Difficulty
                </label>
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
                  Duration (mins)
                </label>
                <input
                  type="number"
                  min={1}
                  value={estimatedDurationMinutes}
                  onChange={(e) => setEstimatedDurationMinutes(e.target.value)}
                  className="w-full p-2 border rounded bg-transparent"
                />
              </div>
            </div>

            {/* Exercise management */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Exercises
              </label>
              <div className="flex flex-col gap-2 mb-3">
                {data?.exercises.map((ex) => (
                  <div
                    key={ex._id}
                    className="border rounded p-3 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium capitalize text-sm">
                        {ex.exercise.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-300 capitalize">
                        {ex.exercise.mainTargetMuscle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(ex._id)}
                      disabled={removeExercise.isPending}
                      className="text-gray-400 dark:text-gray-300 hover:text-red-400 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <select
                value=""
                onChange={(e) => handleAddExercise(e.target.value)}
                disabled={addExercise.isPending || !availableToAdd?.length}
                className="w-full p-2 border rounded bg-transparent capitalize"
              >
                <option value="">
                  {!availableToAdd?.length
                    ? "— no more exercises —"
                    : "— add an exercise —"}
                </option>
                {availableToAdd?.map((ex) => (
                  <option key={ex._id} value={ex._id} className="capitalize">
                    {ex.name} · {ex.mainTargetMuscle}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={updateWorkout.isPending}
                className="px-4 py-2 bg-orange-500 text-black text-sm font-semibold rounded hover:bg-orange-400 disabled:opacity-40"
              >
                {updateWorkout.isPending ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="w-full flex justify-between">
              <p className="text-lg">{data?.description}</p>
              <p className="text-lg">
                Duration: {data?.estimatedDurationMinutes} mins
              </p>
            </div>
            <div className="grid grid-cols-3">
              {data?.exercises.map((ex) => (
                <Link
                  to="/exercises/$id"
                  params={{ id: ex.exercise._id }}
                  key={ex._id}
                >
                  <div className="h-12 border bg-orange-500 text-center content-center cursor-pointer">
                    <h3 className="text-black">{ex.exercise.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
}
