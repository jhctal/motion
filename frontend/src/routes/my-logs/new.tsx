import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  GripVerticalIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useState } from "react";
import { useListExercises } from "../../api/exercises/use-list-exercises";
import useListWorkouts from "../../api/workouts/use-list-workouts";
import {
  useCreateWorkoutSession,
  useStartWorkoutSession,
} from "../../api/workouts/use-workout-sessions";
import FilterableExerciseSelect from "../../ui/filterable-exercise-select";
import Combobox, { ComboboxBadge } from "../../ui/combobox";
import Input from "../../ui/form/input";
import MuscleTag from "../../ui/muscle-tag";
import {
  formatRelativeDay,
  formatSessionTitle,
  formatTime,
} from "../../utils/format-date";
import useRecentlyTrainedMuscles from "../../api/workouts/use-recently-trained-muscles";
import BodyMap from "../../ui/body-map";
import cn from "../../utils/cn";
import {
  ESTIMATE_DEFAULTS,
  estimateWorkout,
  type EstimateExercise,
} from "../../utils/estimate-workout-time";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";
import Button from "../../ui/button/button";

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
} & EstimateExercise;

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
        durationMinutes: te.exercise.duration,
        targetSets: te.targetSets,
        restSeconds: te.restSeconds,
        workSeconds: te.targetDurationSeconds,
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
        durationMinutes: exercise.duration,
      },
    ]);
  }

  function removeExercise(uid: string) {
    setSelectedExercises((prev) => prev.filter((ex) => ex.uid !== uid));
  }

  // Exercise order is saved with the session, so let the user rearrange it
  function moveExercise(from: number, to: number) {
    setSelectedExercises((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  const [draggingUid, setDraggingUid] = useState<string | null>(null);

  // Muscles in this workout, most-worked first
  const muscleCounts = Object.entries(
    selectedExercises.reduce<Record<string, number>>((counts, ex) => {
      if (ex.mainTargetMuscle) {
        counts[ex.mainTargetMuscle] = (counts[ex.mainTargetMuscle] ?? 0) + 1;
      }
      return counts;
    }, {}),
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const estimate = estimateWorkout(selectedExercises);

  // Muscles in this plan that were trained recently, most recent first
  const recent = useRecentlyTrainedMuscles();
  const recovering = muscleCounts
    .map(([muscle]) => [muscle, recent.get(muscle.toLowerCase())] as const)
    .filter((entry): entry is readonly [string, Date] => !!entry[1])
    .sort((a, b) => b[1].getTime() - a[1].getTime());

  const availableExercises = allExercises?.filter(
    (ex) => !selectedExercises.some((sel) => sel.exerciseId === ex._id),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (selectedExercises.length === 0) return;

    // the date is added when displayed (see formatSessionTitle), so don't store it here
    const name = sessionName.trim() || "Workout";

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
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl lg:max-w-6xl grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
      >
        <div className="flex flex-col gap-6 min-w-0">
          {/* Session name */}
          <div className="flex flex-col gap-1.5">
            <Input
              className="capitalize"
              label="Workout name"
              type="text"
              placeholder="e.g. Push Day"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {formatSessionTitle({
                name: sessionName.trim() || "Workout",
                createdAt: new Date(),
              })}
            </p>
          </div>

          {/* Pickers sit side by side when there's room */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Start from a template (optional)
              </label>
              <Combobox
                items={workouts ?? []}
                getKey={(w) => w._id}
                getLabel={(w) => w.name}
                getSearchText={(w) =>
                  `${w.description ?? ""} ${w.difficultyLevel ?? ""} ${w.exercises
                    .map((te) => te.exercise.name)
                    .join(" ")}`
                }
                renderMeta={(w) => (
                  <ComboboxBadge>
                    {w.exercises.length} exercise
                    {w.exercises.length === 1 ? "" : "s"}
                  </ComboboxBadge>
                )}
                value={selectedTemplateId}
                onSelect={(w) => handleTemplateChange(w._id)}
                onClear={() => handleTemplateChange("")}
                placeholder="No template — search templates…"
                noun="template"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Add exercises
              </label>
              <FilterableExerciseSelect
                exercises={availableExercises ?? []}
                onSelect={handleAddExercise}
                disabled={
                  !availableExercises || availableExercises.length === 0
                }
                placeholder={
                  !availableExercises || availableExercises.length === 0
                    ? "— all exercises added —"
                    : "Search exercises to add…"
                }
              />
            </div>
          </div>

          {/* Workout plan */}
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium">
                Your workout
                {selectedExercises.length > 0 && (
                  <span className="ml-1.5 text-gray-500 dark:text-gray-400 font-normal">
                    {selectedExercises.length} exercise
                    {selectedExercises.length === 1 ? "" : "s"}
                  </span>
                )}
              </h2>
              {selectedExercises.length > 1 && (
                <span className="hidden md:block text-xs text-gray-500 dark:text-gray-400">
                  Drag to reorder
                </span>
              )}
            </div>

            {selectedExercises.length > 0 ? (
              <ol className="grid gap-2 md:grid-cols-2">
                {selectedExercises.map((exercise, index) => (
                  <li
                    key={exercise.uid}
                    draggable
                    onDragStart={(e) => {
                      setDraggingUid(exercise.uid);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      const from = selectedExercises.findIndex(
                        (ex) => ex.uid === draggingUid,
                      );
                      if (from !== -1) moveExercise(from, index);
                    }}
                    onDragEnd={() => setDraggingUid(null)}
                    className={cn(
                      "group flex items-center gap-3 pl-2 pr-2 py-2 rounded-lg border bg-gray-50 dark:bg-zinc-900 transition-colors",
                      draggingUid === exercise.uid
                        ? "border-orange-500 opacity-60"
                        : "border-gray-300 dark:border-zinc-700 md:hover:border-orange-400",
                    )}
                  >
                    <GripVerticalIcon
                      aria-hidden="true"
                      size={16}
                      className="hidden md:block shrink-0 text-gray-300 dark:text-zinc-600 cursor-grab"
                    />
                    <span className="size-6 shrink-0 grid place-items-center rounded-full bg-gray-200 dark:bg-zinc-800 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {index + 1}
                    </span>
                    <p className="flex-1 min-w-0 font-medium capitalize text-sm truncate">
                      {exercise.name}
                    </p>
                    <RecoveryIcon
                      muscle={exercise.mainTargetMuscle}
                      recent={recent}
                    />
                    {exercise.mainTargetMuscle && (
                      <MuscleTag muscle={exercise.mainTargetMuscle} />
                    )}
                    {/* keyboard-friendly reordering; drag does the same on desktop */}
                    <div className="hidden md:flex opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => moveExercise(index, index - 1)}
                        disabled={index === 0}
                        aria-label={`Move ${exercise.name} earlier`}
                        className="size-7 grid place-items-center rounded text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-800 disabled:invisible"
                      >
                        <ChevronUpIcon size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveExercise(index, index + 1)}
                        disabled={index === selectedExercises.length - 1}
                        aria-label={`Move ${exercise.name} later`}
                        className="size-7 grid place-items-center rounded text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-800 disabled:invisible"
                      >
                        <ChevronDownIcon size={16} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExercise(exercise.uid)}
                      aria-label={`Remove ${exercise.name}`}
                      className="size-8 shrink-0 grid place-items-center rounded text-lg leading-none text-gray-400 dark:text-gray-300 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-400 dark:text-gray-300 text-sm py-10 text-center border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg">
                Add at least one exercise, or start from a template
              </p>
            )}
          </section>
        </div>

        {/* Summary: sits beside the plan on large screens, below it on small ones */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-0">
          <WorkoutSummary
            minutes={estimate.minutes}
            sets={estimate.sets}
            exerciseCount={selectedExercises.length}
            muscleCounts={muscleCounts}
            recovering={recovering}
            recent={recent}
          />
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-zinc-700 md:mt-2 lg:mt-0 lg:pt-0 lg:border-0 lg:flex-col-reverse">
            <Button
              variant="outline"
              className="flex-1 lg:flex-none h-auto py-3"
              disabled={isSubmitting}
              onClick={() => navigate({ to: "/my-logs" })}
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={isSubmitting || selectedExercises.length === 0}
              className="flex-1 lg:flex-none py-3 bg-orange-500 text-black font-semibold rounded-lg hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Starting..." : "Start workout"}
            </button>
          </div>
        </aside>
      </form>
    </PageWrapper>
  );
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return rest
    ? `${Math.floor(minutes / 60)} h ${rest} min`
    : `${minutes / 60} h`;
}

function WorkoutSummary({
  minutes,
  sets,
  exerciseCount,
  muscleCounts,
  recovering,
  recent,
}: {
  minutes: number;
  sets: number;
  exerciseCount: number;
  muscleCounts: [string, number][];
  recovering: (readonly [string, Date])[];
  recent: Map<string, Date>;
}) {
  const d = ESTIMATE_DEFAULTS;
  const hasExercises = exerciseCount > 0;

  return (
    <>
      {/* Phones: compact data strip */}
      <div className="md:hidden rounded-lg border border-gray-300 dark:border-zinc-700 text-xs">
        <dl className="grid grid-cols-3 divide-x divide-gray-300 dark:divide-zinc-700">
          <div className="px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Est. time
            </dt>
            <dd
              className="text-sm font-semibold tabular-nums"
              aria-live="polite"
            >
              {hasExercises ? `~${formatMinutes(minutes)}` : "—"}
            </dd>
          </div>
          <div className="px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Ends
            </dt>
            <dd className="text-sm font-semibold tabular-nums">
              {hasExercises
                ? formatTime(new Date(Date.now() + minutes * 60_000))
                : "—"}
            </dd>
          </div>
          <div className="px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Ex / sets
            </dt>
            <dd className="text-sm font-semibold tabular-nums">
              {hasExercises ? `${exerciseCount} / ~${sets}` : "—"}
            </dd>
          </div>
        </dl>
        {recovering.length > 0 && (
          <p className="flex items-start gap-1.5 px-3 py-2 border-t border-gray-300 dark:border-zinc-700 text-amber-700 dark:text-amber-400">
            <TriangleAlertIcon
              size={13}
              aria-hidden="true"
              className="mt-px shrink-0"
            />
            <span>
              Recently trained:{" "}
              {recovering
                .map(([m, d]) => `${m} (${formatRelativeDay(d)})`)
                .join(", ")}
            </span>
          </p>
        )}
        {muscleCounts.length > 0 && (
          <div className="flex flex-wrap gap-1 px-3 py-2 border-t border-gray-300 dark:border-zinc-700">
            {muscleCounts.map(([muscle, count]) => (
              <MuscleTag key={muscle} muscle={muscle} count={count} />
            ))}
          </div>
        )}
      </div>

      {/* Tablet and up: full card */}
      <div className="hidden md:flex flex-col gap-5 p-5 rounded-lg border border-gray-300 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <ClockIcon size={14} aria-hidden="true" />
            Estimated time
          </p>
          {exerciseCount === 0 ? (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Add exercises to see how long this workout will take.
            </p>
          ) : (
            <>
              <p
                className="mt-1 text-4xl font-semibold tabular-nums"
                aria-live="polite"
              >
                ~{formatMinutes(minutes)}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Finish around{" "}
                {formatTime(new Date(Date.now() + minutes * 60_000))}
              </p>
            </>
          )}
        </div>

        {exerciseCount > 0 && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-white dark:bg-zinc-800 px-3 py-2">
              <dt className="text-xs text-gray-500 dark:text-gray-400">
                Exercises
              </dt>
              <dd className="text-lg font-semibold tabular-nums">
                {exerciseCount}
              </dd>
            </div>
            <div className="rounded-lg bg-white dark:bg-zinc-800 px-3 py-2">
              <dt className="text-xs text-gray-500 dark:text-gray-400">Sets</dt>
              <dd className="text-lg font-semibold tabular-nums">~{sets}</dd>
            </div>
          </dl>
        )}

        <BodyMap worked={Object.fromEntries(muscleCounts)} recent={recent} />

        {recovering.length > 0 && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-300">
            <p className="flex items-center gap-1.5 font-medium">
              <TriangleAlertIcon size={14} aria-hidden="true" />
              Still recovering
            </p>
            <ul className="flex flex-col gap-0.5 text-xs">
              {recovering.map(([muscle, date]) => (
                <li key={muscle} className="capitalize">
                  {muscle}{" "}
                  <span className="normal-case opacity-80">
                    — trained {formatRelativeDay(date)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {muscleCounts.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Muscles worked
            </p>
            <div className="flex flex-wrap gap-1.5">
              {muscleCounts.map(([muscle, count]) => (
                <MuscleTag key={muscle} muscle={muscle} count={count} />
              ))}
            </div>
          </div>
        )}

        {exerciseCount > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Assumes {d.sets} sets of ~{d.workSeconds}s with {d.restSeconds}s
            rest, unless the template says otherwise.
          </p>
        )}
      </div>
    </>
  );
}

// Warns on an exercise card when its muscle was trained recently
function RecoveryIcon({
  muscle,
  recent,
}: {
  muscle?: string;
  recent: Map<string, Date>;
}) {
  const trained = muscle ? recent.get(muscle.toLowerCase()) : undefined;
  if (!muscle || !trained) return null;

  const label = `${muscle} trained ${formatRelativeDay(trained)}`;
  return (
    <span className="shrink-0 text-amber-500" title={label}>
      <TriangleAlertIcon size={15} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
