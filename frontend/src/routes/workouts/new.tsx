import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ClockIcon, FileTextIcon } from "lucide-react";
import {
  useListExercises,
  type Exercise,
} from "../../api/exercises/use-list-exercises";
import { useAddExerciseToWorkout } from "../../api/workouts/use-add-exercise-to-workout";
import { useCreateWorkout } from "../../api/workouts/use-create-workout";
import useTrainingHistory from "../../api/workouts/use-training-history";
import FilterableExerciseSelect from "../../ui/filterable-exercise-select";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";
import Input from "../../ui/form/input";
import Select from "../../ui/form/select";
import Textarea from "../../ui/form/textarea";
import Button from "../../ui/button/button";
import PlanExerciseCard from "../../ui/plan-exercise-card";
import ExerciseSuggestions from "../../ui/exercise-suggestions";
import MuscleTag from "../../ui/muscle-tag";
import BodyMap from "../../ui/body-map";
import { FormError } from "../../ui/auth-layout";
import { WidgetCard } from "../../ui/widgets/widget-card";
import {
  ESTIMATE_DEFAULTS,
  estimateWorkout,
} from "../../utils/estimate-workout-time";
import { suggestExercises } from "../../utils/suggest-exercises";
import { formatDuration } from "../../utils/format-date";
import { getErrorMessage } from "../../utils/api-error";

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
const MIN_SETS = 1;
const MAX_SETS = 10;

type SelectedExercise = {
  uid: string;
  exercise: Exercise;
  // saved as the template's targetSets
  sets: number;
};

function NewWorkout() {
  const navigate = useNavigate();
  const createWorkout = useCreateWorkout();
  const addExercise = useAddExerciseToWorkout();
  const { data: allExercises } = useListExercises();
  const history = useTrainingHistory();

  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState<string>("beginner");
  const [duration, setDuration] = useState("");
  const [selected, setSelected] = useState<SelectedExercise[]>([]);
  const [draggingUid, setDraggingUid] = useState<string | null>(null);

  const availableExercises = allExercises?.filter(
    (ex) => !selected.some((sel) => sel.exercise._id === ex._id),
  );

  function handleAddExercise(exerciseId: string) {
    const exercise = allExercises?.find((ex) => ex._id === exerciseId);
    if (!exercise) return;
    setSelected((prev) => [
      ...prev,
      { uid: crypto.randomUUID(), exercise, sets: ESTIMATE_DEFAULTS.sets },
    ]);
  }

  function removeExercise(uid: string) {
    setSelected((prev) => prev.filter((ex) => ex.uid !== uid));
  }

  function setSets(uid: string, sets: number) {
    const clamped = Math.min(MAX_SETS, Math.max(MIN_SETS, sets));
    setSelected((prev) =>
      prev.map((ex) => (ex.uid === uid ? { ...ex, sets: clamped } : ex)),
    );
  }

  // Exercise order is saved with the template
  function moveExercise(from: number, to: number) {
    setSelected((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  const estimate = estimateWorkout(
    selected.map(({ exercise, sets }) => ({
      category: exercise.category,
      durationMinutes: exercise.duration,
      targetSets: sets,
    })),
  );

  const muscleCounts = Object.entries(
    selected.reduce<Record<string, number>>((acc, { exercise }) => {
      const m = exercise.mainTargetMuscle;
      if (m) acc[m] = (acc[m] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const suggestions = suggestExercises({
    planMuscles: selected.map(({ exercise }) => exercise.mainTargetMuscle),
    planExerciseIds: selected.map(({ exercise }) => exercise._id),
    exercises: allExercises ?? [],
    lastTrained: history.lastTrained,
  });

  const nameError =
    nameTouched && !name.trim() ? "Give the workout a name" : undefined;
  const isSubmitting = createWorkout.isPending || addExercise.isPending;
  const submitError = createWorkout.error ?? addExercise.error;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameTouched(true);
    if (!name.trim()) return;

    const workout = await createWorkout.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      difficultyLevel: difficultyLevel as (typeof DIFFICULTIES)[number],
      // blank duration falls back to the estimate
      estimatedDurationMinutes: duration
        ? Number(duration)
        : estimate.minutes || undefined,
    });

    // added one at a time so they keep the chosen order
    for (const { exercise, sets } of selected) {
      await addExercise.mutateAsync({
        workoutId: workout._id,
        exerciseId: exercise._id,
        targetSets: sets,
      });
    }

    navigate({ to: "/workouts/$id", params: { id: workout._id } });
  }

  return (
    <PageWrapper pageName="New workout">
      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-2 max-w-2xl lg:max-w-6xl grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
      >
        <div className="flex flex-col gap-6 min-w-0">
          <WidgetCard title="Details" icon={FileTextIcon}>
            <div className="flex flex-col gap-4">
              <Input
                label="Name"
                className="capitalize"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setNameTouched(true)}
                placeholder="e.g. Push day"
                error={nameError}
              />
              <Textarea
                label="Description (optional)"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this workout for?"
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Difficulty"
                  value={difficultyLevel}
                  onChange={(e) => setDifficultyLevel(e.target.value)}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </option>
                  ))}
                </Select>
                <div className="flex flex-col gap-1.5">
                  <Input
                    label="Duration (mins)"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder={
                      estimate.minutes ? `~${estimate.minutes}` : "e.g. 60"
                    }
                  />
                  {!duration && estimate.minutes > 0 && (
                    <button
                      type="button"
                      onClick={() => setDuration(String(estimate.minutes))}
                      className="self-start text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
                    >
                      Use estimate ({formatDuration(estimate.minutes)})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </WidgetCard>

          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium">
                Exercises
                {selected.length > 0 && (
                  <span className="ml-1.5 font-normal text-gray-500 dark:text-gray-400">
                    {selected.length}
                  </span>
                )}
              </h2>
              {selected.length > 1 && (
                <span className="hidden md:block text-xs text-gray-500 dark:text-gray-400">
                  Drag to reorder
                </span>
              )}
            </div>

            <FilterableExerciseSelect
              exercises={availableExercises ?? []}
              onSelect={handleAddExercise}
              disabled={!availableExercises || availableExercises.length === 0}
              placeholder={
                !availableExercises || availableExercises.length === 0
                  ? "— no more exercises —"
                  : "Search exercises to add…"
              }
            />

            {selected.length > 0 ? (
              <ol className="grid grid-cols-1 gap-2 md:grid-cols-2 md:items-start">
                {selected.map(({ uid, exercise, sets }, index) => (
                  <PlanExerciseCard
                    key={uid}
                    index={index}
                    total={selected.length}
                    name={exercise.name}
                    mainTargetMuscle={exercise.mainTargetMuscle}
                    category={exercise.category}
                    details={exercise}
                    sets={sets}
                    onSetsChange={(n) => setSets(uid, n)}
                    lastPerformance={history.lastPerformance.get(exercise._id)}
                    dragging={draggingUid === uid}
                    dragProps={{
                      draggable: true,
                      onDragStart: (e) => {
                        setDraggingUid(uid);
                        e.dataTransfer.effectAllowed = "move";
                      },
                      onDragOver: (e) => {
                        e.preventDefault();
                        const from = selected.findIndex(
                          (ex) => ex.uid === draggingUid,
                        );
                        if (from !== -1) moveExercise(from, index);
                      },
                      onDragEnd: () => setDraggingUid(null),
                    }}
                    onMove={(delta) => moveExercise(index, index + delta)}
                    onRemove={() => removeExercise(uid)}
                  />
                ))}
              </ol>
            ) : (
              <p className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400 dark:border-zinc-700 dark:text-gray-300">
                Search above to add exercises. You can also save an empty
                template and add them later.
              </p>
            )}
          </section>

          <ExerciseSuggestions
            suggestions={suggestions}
            onAdd={handleAddExercise}
          />
        </div>

        {/* Summary and actions */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-0">
          <WidgetCard title="Summary" icon={ClockIcon}>
            <dl className="grid grid-cols-3 divide-x divide-gray-200 rounded-lg bg-gray-50 py-2 dark:divide-zinc-800 dark:bg-zinc-800/50">
              {[
                {
                  label: "Est. time",
                  value: estimate.minutes
                    ? `~${formatDuration(estimate.minutes)}`
                    : "—",
                },
                { label: "Exercises", value: String(selected.length) },
                {
                  label: "Sets",
                  value: estimate.sets ? String(estimate.sets) : "—",
                },
              ].map((s) => (
                <div key={s.label} className="px-3">
                  <dt className="text-[11px] text-gray-500 dark:text-gray-400">
                    {s.label}
                  </dt>
                  <dd className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>

            {muscleCounts.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Muscles worked
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {muscleCounts.map(([m, n]) => (
                    <MuscleTag key={m} muscle={m} count={n} />
                  ))}
                </div>
                {/* body map: tablet and up only */}
                <BodyMap
                  className="hidden md:flex mt-2"
                  showLegend={false}
                  recent={new Map()}
                  worked={Object.fromEntries(muscleCounts)}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add exercises to see the time estimate and muscles worked.
              </p>
            )}
          </WidgetCard>

          <FormError
            message={submitError ? getErrorMessage(submitError) : undefined}
          />

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-zinc-700 md:mt-2 lg:mt-0 lg:pt-0 lg:border-0 lg:flex-col-reverse">
            <Button
              variant="outline"
              className="flex-1 lg:flex-none h-auto py-3"
              disabled={isSubmitting}
              onClick={() => navigate({ to: "/workouts" })}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 lg:flex-none h-auto py-3 font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating…" : "Create workout"}
            </Button>
          </div>
        </aside>
      </form>
    </PageWrapper>
  );
}
