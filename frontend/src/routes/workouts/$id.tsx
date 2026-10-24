import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  ClipboardListIcon,
  GaugeIcon,
  GlobeIcon,
  PencilIcon,
  PlayIcon,
  Trash2Icon,
  WrenchIcon,
} from "lucide-react";
import useUserProfile from "../../api/user/use-user-profile";
import { useListExercises } from "../../api/exercises/use-list-exercises";
import { useAddExerciseToWorkout } from "../../api/workouts/use-add-exercise-to-workout";
import { useDeleteWorkout } from "../../api/workouts/use-delete-workout";
import useFindWorkout from "../../api/workouts/use-find-workout";
import { useRemoveExerciseFromWorkout } from "../../api/workouts/use-remove-exercise-from-workout";
import { useUpdateWorkout } from "../../api/workouts/use-update-workout";
import useTrainingHistory from "../../api/workouts/use-training-history";
import type { TemplateExercise } from "../../api/workouts/use-list-workouts";
import type { LastPerformance } from "../../utils/training-history";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";
import Input from "../../ui/form/input";
import Select from "../../ui/form/select";
import Textarea from "../../ui/form/textarea";
import Button from "../../ui/button/button";
import ConfirmModal from "../../ui/modal/confirm-modal";
import FilterableExerciseSelect from "../../ui/filterable-exercise-select";
import MuscleTag from "../../ui/muscle-tag";
import BodyMap from "../../ui/body-map";
import { LastPerformanceLine } from "../../ui/exercise-info";
import {
  CategoryIcon,
  CompoundBadge,
  DifficultyMeter,
} from "../../ui/exercise-badges";
import { Skeleton, WidgetCard } from "../../ui/widgets/widget-card";
import {
  ESTIMATE_DEFAULTS,
  estimateWorkout,
} from "../../utils/estimate-workout-time";
import { formatDuration } from "../../utils/format-date";

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

function BackLink() {
  return (
    <Link
      to="/workouts"
      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400"
    >
      <ArrowLeftIcon size={14} aria-hidden="true" />
      All workouts
    </Link>
  );
}

function WorkoutView() {
  const { id = "" } = useParams({ strict: false });
  const navigate = useNavigate();
  const { data, isLoading, error } = useFindWorkout(id);
  const { data: profile } = useUserProfile();
  const { data: allExercises } = useListExercises();
  const history = useTrainingHistory();

  const updateWorkout = useUpdateWorkout();
  const deleteWorkout = useDeleteWorkout();
  const addExercise = useAddExerciseToWorkout();
  const removeExercise = useRemoveExerciseFromWorkout();

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
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
      difficultyLevel: difficultyLevel as (typeof DIFFICULTIES)[number],
      estimatedDurationMinutes: estimatedDurationMinutes
        ? Number(estimatedDurationMinutes)
        : undefined,
    });
    setEditing(false);
  }

  async function handleDelete() {
    if (!id) return;
    await deleteWorkout.mutateAsync(id);
    navigate({ to: "/workouts" });
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <BackLink />
        <div className="mt-4 flex flex-col gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </PageWrapper>
    );
  }

  if (error || !data) {
    return (
      <PageWrapper>
        <BackLink />
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          We couldn't find that workout.
        </p>
      </PageWrapper>
    );
  }

  const exercises = [...data.exercises].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  const existingIds = new Set(exercises.map((e) => e.exercise._id));
  const availableToAdd = allExercises?.filter((ex) => !existingIds.has(ex._id));

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6 max-w-6xl">
        <BackLink />

        {editing ? (
          <EditWorkout
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            difficultyLevel={difficultyLevel}
            setDifficultyLevel={setDifficultyLevel}
            duration={estimatedDurationMinutes}
            setDuration={setEstimatedDurationMinutes}
            exercises={exercises}
            onRemoveExercise={(teId) =>
              removeExercise.mutate({ workoutId: id, templateExerciseId: teId })
            }
            isRemoving={removeExercise.isPending}
            addPicker={
              <FilterableExerciseSelect
                exercises={availableToAdd ?? []}
                onSelect={(exerciseId) =>
                  addExercise.mutate({ workoutId: id, exerciseId })
                }
                disabled={addExercise.isPending || !availableToAdd?.length}
                placeholder={
                  !availableToAdd?.length
                    ? "— no more exercises —"
                    : "Search exercises to add…"
                }
              />
            }
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            isSaving={updateWorkout.isPending}
          />
        ) : (
          <>
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex flex-col gap-3 min-w-0">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight capitalize text-gray-900 dark:text-white">
                  {data.name}
                </h1>
                {data.description && (
                  <p className="max-w-2xl text-gray-600 dark:text-gray-300">
                    {data.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <DifficultyMeter level={data.difficultyLevel} />
                  {data.isPublic && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <GlobeIcon size={12} aria-hidden="true" />
                      Public template
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => setEditing(true)}
                    >
                      <PencilIcon size={15} aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="gap-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2Icon size={15} aria-hidden="true" />
                      Delete
                    </Button>
                  </>
                )}
                <Link
                  to="/my-logs/new"
                  search={{ template: data._id }}
                  className="flex-1 md:flex-none"
                >
                  <Button className="w-full gap-1.5">
                    <PlayIcon size={15} aria-hidden="true" />
                    Start this workout
                  </Button>
                </Link>
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
              {/* Exercise plan */}
              <WidgetCard
                title={`Exercises (${exercises.length})`}
                icon={ClipboardListIcon}
              >
                {exercises.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This template has no exercises yet.
                  </p>
                ) : (
                  <ol className="-mx-5 -mb-5 divide-y divide-gray-100 dark:divide-zinc-800">
                    {exercises.map((te, i) => (
                      <TemplateExerciseRow
                        key={te._id}
                        index={i}
                        te={te}
                        last={history.lastPerformance.get(te.exercise._id)}
                      />
                    ))}
                  </ol>
                )}
              </WidgetCard>

              <WorkoutSidebar
                exercises={exercises}
                plannedMinutes={data.estimatedDurationMinutes}
              />
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={`Delete "${data.name}"?`}
        description="This removes the template for everyone. Workouts already logged from it are kept."
        confirmLabel="Delete template"
        destructive
        icon={Trash2Icon}
        isPending={deleteWorkout.isPending}
      />
    </PageWrapper>
  );
}

// Planned sets/reps/weight/rest as short chips; only what the template sets
function targetsOf(te: TemplateExercise) {
  const t: string[] = [];
  if (te.targetSets && te.targetReps)
    t.push(`${te.targetSets} × ${te.targetReps}`);
  else if (te.targetSets) t.push(`${te.targetSets} sets`);
  else if (te.targetReps) t.push(`${te.targetReps} reps`);
  if (te.targetWeight) t.push(`${te.targetWeight} kg`);
  if (te.targetDurationSeconds) t.push(`${te.targetDurationSeconds}s hold`);
  if (te.restSeconds) t.push(`${te.restSeconds}s rest`);
  return t;
}

function TemplateExerciseRow({
  index,
  te,
  last,
}: {
  index: number;
  te: TemplateExercise;
  last?: LastPerformance;
}) {
  const ex = te.exercise;
  const thumb = ex.images?.[0];
  const targets = targetsOf(te);

  return (
    <li className="flex gap-4 px-5 py-4">
      <span className="size-6 shrink-0 mt-0.5 grid place-items-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-zinc-800 dark:text-gray-300">
        {index + 1}
      </span>

      {/* Thumbnail, or the category icon when there's no photo */}
      <Link
        to="/exercises/$id"
        params={{ id: ex._id }}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden sm:grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-800"
      >
        {thumb ? (
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <CategoryIcon
            category={ex.category}
            size={20}
            className="text-gray-400"
          />
        )}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/exercises/$id"
            params={{ id: ex._id }}
            className="font-medium capitalize text-gray-900 hover:text-orange-600 dark:text-white dark:hover:text-orange-400"
          >
            {ex.name}
          </Link>
          {ex.mainTargetMuscle && <MuscleTag muscle={ex.mainTargetMuscle} />}
          {ex.isCompound && <CompoundBadge />}
        </div>

        {targets.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {targets.map((t) => (
              <span
                key={t}
                className="rounded-md bg-orange-50 px-1.5 py-0.5 text-xs font-medium tabular-nums text-orange-800 dark:bg-orange-500/10 dark:text-orange-300"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {te.notes && (
          <p className="text-sm italic text-gray-600 dark:text-gray-300">
            {te.notes}
          </p>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          <LastPerformanceLine perf={last} />
        </p>
      </div>
    </li>
  );
}

function WorkoutSidebar({
  exercises,
  plannedMinutes,
}: {
  exercises: TemplateExercise[];
  plannedMinutes?: number;
}) {
  const estimate = estimateWorkout(
    exercises.map((te) => ({
      category: te.exercise.category,
      durationMinutes: te.exercise.duration,
      targetSets: te.targetSets,
      restSeconds: te.restSeconds,
      workSeconds: te.targetDurationSeconds,
    })),
  );

  const muscleCounts = Object.entries(
    exercises.reduce<Record<string, number>>((acc, te) => {
      const m = te.exercise.mainTargetMuscle;
      if (m) acc[m] = (acc[m] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const equipment = [
    ...new Set(exercises.flatMap((te) => te.exercise.equipmentNeeded ?? [])),
  ].sort();

  const stats = [
    {
      label: "Duration",
      value: plannedMinutes
        ? formatDuration(plannedMinutes)
        : estimate.minutes
          ? `~${formatDuration(estimate.minutes)}`
          : "—",
    },
    { label: "Exercises", value: String(exercises.length) },
    { label: "Sets", value: estimate.sets ? `~${estimate.sets}` : "—" },
  ];

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-0">
      <WidgetCard title="At a glance" icon={GaugeIcon}>
        <dl className="grid grid-cols-3 divide-x divide-gray-200 rounded-lg bg-gray-50 py-2 dark:divide-zinc-800 dark:bg-zinc-800/50">
          {stats.map((s) => (
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
        {!plannedMinutes && estimate.minutes > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Estimated from {ESTIMATE_DEFAULTS.sets} sets with{" "}
            {ESTIMATE_DEFAULTS.restSeconds}s rest where the template doesn't
            say.
          </p>
        )}

        {muscleCounts.length > 0 && (
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
        )}
      </WidgetCard>

      {equipment.length > 0 && (
        <WidgetCard title="Equipment needed" icon={WrenchIcon}>
          <div className="flex flex-wrap gap-1.5">
            {equipment.map((item) => (
              <span
                key={item}
                className="rounded-md bg-gray-100 px-2 py-1 text-xs capitalize text-gray-700 dark:bg-zinc-800 dark:text-gray-300"
              >
                {item}
              </span>
            ))}
          </div>
        </WidgetCard>
      )}
    </aside>
  );
}

function EditWorkout({
  name,
  setName,
  description,
  setDescription,
  difficultyLevel,
  setDifficultyLevel,
  duration,
  setDuration,
  exercises,
  onRemoveExercise,
  isRemoving,
  addPicker,
  onSave,
  onCancel,
  isSaving,
}: {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  difficultyLevel: string;
  setDifficultyLevel: (v: string) => void;
  duration: string;
  setDuration: (v: string) => void;
  exercises: TemplateExercise[];
  onRemoveExercise: (templateExerciseId: string) => void;
  isRemoving: boolean;
  addPicker: React.ReactNode;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        Edit workout
      </h1>

      <div className="flex flex-col gap-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          label="Description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Difficulty"
            value={difficultyLevel}
            onChange={(e) => setDifficultyLevel(e.target.value)}
            className="capitalize"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d} className="capitalize">
                {d}
              </option>
            ))}
          </Select>
          <Input
            label="Duration (mins)"
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Exercises</h2>
        {exercises.length > 0 && (
          <ol className="flex flex-col gap-2">
            {exercises.map((te, i) => (
              <li
                key={te._id}
                className="flex items-center gap-3 rounded-lg border border-gray-300 bg-gray-50 py-2 pl-3 pr-1.5 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <span className="size-6 shrink-0 grid place-items-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600 dark:bg-zinc-800 dark:text-gray-300">
                  {i + 1}
                </span>
                <span className="flex-1 min-w-0 truncate text-sm font-medium capitalize">
                  {te.exercise.name}
                </span>
                {te.exercise.mainTargetMuscle && (
                  <MuscleTag muscle={te.exercise.mainTargetMuscle} />
                )}
                <button
                  type="button"
                  onClick={() => onRemoveExercise(te._id)}
                  disabled={isRemoving}
                  aria-label={`Remove ${te.exercise.name}`}
                  className="size-8 shrink-0 grid place-items-center rounded text-lg leading-none text-gray-400 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-40 transition-colors"
                >
                  ×
                </button>
              </li>
            ))}
          </ol>
        )}
        {addPicker}
      </section>

      <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-zinc-700">
        <Button
          variant="outline"
          className="flex-1 sm:flex-none sm:w-32"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          className="flex-1 sm:flex-none sm:w-40"
          disabled={isSaving || !name.trim()}
          onClick={onSave}
        >
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
