import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import {
  useListExercises,
  type Exercise,
} from "../../api/exercises/use-list-exercises";
import useTrainingHistory from "../../api/workouts/use-training-history";
import type { LastPerformance } from "../../utils/training-history";
import useDismiss from "../../hooks/use-dismiss";
import cn from "../../utils/cn";
import MuscleTag from "../../ui/muscle-tag";
import Collapse from "../../ui/collapse";
import { ChevronDownIcon } from "lucide-react";
import {
  ExerciseInfoPopover,
  ExerciseInfoToggle,
  ExerciseMeta,
  InfoButton,
  LastPerformanceLine,
} from "../../ui/exercise-info";
import FilterableExerciseSelect from "../../ui/filterable-exercise-select";
import type {
  PopulatedExercise,
  WorkoutExercise,
} from "../../api/workout-types";
import {
  useAddExerciseToSession,
  useCompleteWorkoutSession,
  useDeleteExerciseSet,
  useDeleteWorkoutSession,
  useRemoveExerciseFromSession,
  useUpdateExerciseSet,
  useWorkoutSession,
} from "../../api/workouts/use-workout-sessions";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";
import Button from "../../ui/button/button";
import {
  formatDateTime,
  formatNumber,
  formatSessionTitle,
} from "../../utils/format-date";
import { exportSessions } from "../../utils/export-logs";
import Textarea from "../../ui/form/textarea";
import Input from "../../ui/form/input";
import {
  CompletedExerciseList,
  CompletedSessionTable,
  CompletedSummary,
} from "../../ui/completed-session";

type SetValues = {
  reps: number;
  weight: number;
  durationInSeconds: number;
};

type FormValues = {
  exercises: { sets: SetValues[] }[];
  rating: number;
  feeling: "terrible" | "bad" | "okay" | "good" | "amazing";
  notes: string;
};

export const Route = createFileRoute("/my-logs/$id")({
  beforeLoad: async () => {
    const user = localStorage.getItem("user");
    if (!user) {
      throw redirect({ to: "/auth" });
    }
  },
  component: ActiveLog,
});

function BackToLogs() {
  return (
    <Link
      to="/my-logs"
      className="inline-block mb-2 text-sm text-gray-500 dark:text-gray-300 hover:text-orange-500"
    >
      ← Back to logs
    </Link>
  );
}

function ActiveLog() {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const sessionId = id ?? "";

  const { data: session, isLoading, error } = useWorkoutSession(sessionId);
  const { data: allExercises } = useListExercises();
  const history = useTrainingHistory(sessionId);
  const updateSet = useUpdateExerciseSet();
  const deleteSet = useDeleteExerciseSet();
  const addExercise = useAddExerciseToSession();
  const removeExercise = useRemoveExerciseFromSession();
  const completeSession = useCompleteWorkoutSession();
  const deleteSession = useDeleteWorkoutSession();
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const methods = useForm<FormValues>({
    defaultValues: { exercises: [], rating: 3, feeling: "good", notes: "" },
  });
  const { reset, handleSubmit } = methods;

  const initialized = useRef(false);
  useEffect(() => {
    if (session && !initialized.current) {
      reset({
        exercises: session.exercises.map((ex) => ({
          sets: (ex.sets ?? []).map((s) => ({
            reps: s.reps,
            weight: s.weight,
            durationInSeconds: s.durationInSeconds ?? 0,
          })),
        })),
        rating: 3,
        feeling: "good",
        notes: "",
      });
      initialized.current = true;
    }
  }, [session, reset]);

  async function handleAddExercise(exerciseId: string) {
    if (!exerciseId) return;
    initialized.current = false;
    await addExercise.mutateAsync({ sessionId, exerciseId });
  }

  async function handleRemoveExercise(exerciseIndex: number) {
    initialized.current = false;
    await removeExercise.mutateAsync({ sessionId, exerciseIndex });
  }

  async function onFinish(data: FormValues, completedAt?: string) {
    await completeSession.mutateAsync({
      id: sessionId,
      rating: data.rating,
      feeling: data.feeling,
      notes: data.notes || undefined,
      completedAt,
    });
    navigate({ to: "/my-logs" });
  }

  if (error) {
    return (
      <PageWrapper>
        <BackToLogs />
        <div className="font-semibold text-xl">Error</div>
        <p className="text-red-400">
          {(error as Error).message ?? "Failed to load session"}
        </p>
      </PageWrapper>
    );
  }

  if (isLoading || !session) {
    return (
      <PageWrapper pageName="Loading...">
        <p className="text-gray-400 dark:text-gray-300">Loading session...</p>
      </PageWrapper>
    );
  }

  const addedExerciseIds = new Set(
    session.exercises.map((ex) => (ex.exercise as PopulatedExercise)._id),
  );
  const availableExercises = allExercises?.filter(
    (ex) => !addedExerciseIds.has(ex._id),
  );

  const isCompleted = session.status === "completed";

  const totalSets = session.exercises.reduce(
    (total, ex) => total + (ex.sets?.length || 0),
    0,
  );

  return (
    <FormProvider {...methods}>
      <PageWrapper>
        <BackToLogs />
        {/* Title and download on one line from sm up; download above the title on phones */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="font-semibold text-xl capitalize">
            {formatSessionTitle(session)}
          </div>
          {/* Only finished workouts are worth exporting */}
          {isCompleted && (
            <div className="order-first sm:order-none flex flex-wrap items-center gap-2 shrink-0 text-sm text-gray-500 dark:text-gray-400">
              Download this workout:
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportSessions(
                    [session],
                    "json",
                    `${session.name}-${session.createdAt.slice(0, 10)}`,
                  )
                }
              >
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportSessions(
                    [session],
                    "csv",
                    `${session.name}-${session.createdAt.slice(0, 10)}`,
                  )
                }
              >
                CSV
              </Button>
            </div>
          )}
        </div>
        {isCompleted ? (
          <CompletedSummary session={session} />
        ) : (
          <ProgressBar session={session} totalSets={totalSets} />
        )}

        {/* Finished workouts: a table where there's room, compact cards on phones */}
        {isCompleted && (
          <div className="mb-4">
            <div className="hidden md:block">
              <CompletedSessionTable session={session} />
            </div>
            <div className="md:hidden">
              <CompletedExerciseList session={session} />
            </div>
          </div>
        )}

        {!isCompleted && (
          <div className="flex flex-col gap-6 mb-4">
            <div className="mb-8">
              {!availableExercises || availableExercises.length === 0 ? (
                <div className="w-full p-4 border border-dashed rounded text-sm text-gray-500 text-center opacity-40">
                  — all exercises added —
                </div>
              ) : (
                <FilterableExerciseSelect
                  exercises={availableExercises}
                  onSelect={handleAddExercise}
                  disabled={addExercise.isPending}
                  placeholder={
                    addExercise.isPending ? "Adding..." : "+ Add exercise"
                  }
                />
              )}
            </div>

            {session.exercises.map((exercise, exerciseIndex) => (
              <ExerciseCard
                key={
                  (exercise.exercise as PopulatedExercise)._id + exerciseIndex
                }
                exercise={exercise}
                exerciseIndex={exerciseIndex}
                sessionId={sessionId}
                updateSet={updateSet}
                deleteSet={deleteSet}
                initializedRef={initialized}
                onRemove={() => handleRemoveExercise(exerciseIndex)}
                details={allExercises?.find(
                  (ex) =>
                    ex._id === (exercise.exercise as PopulatedExercise)._id,
                )}
                lastPerformance={history.lastPerformance.get(
                  (exercise.exercise as PopulatedExercise)._id,
                )}
                isRemoving={removeExercise.isPending}
              />
            ))}
          </div>
        )}

        {session.status !== "completed" && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setShowFinishModal(true)}
              className="w-full py-4 bg-orange-500 text-black font-semibold rounded-lg text-base hover:bg-orange-400"
            >
              Finish workout
            </button>
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="w-full py-4 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              Cancel workout
            </button>
          </div>
        )}

        {showFinishModal && (
          <FinishModal
            onClose={() => setShowFinishModal(false)}
            onConfirm={(completedAt) =>
              handleSubmit((data) => onFinish(data, completedAt))()
            }
            isPending={completeSession.isPending}
            startedAt={session.startedAt ?? session.createdAt}
            lastActivityAt={session.updatedAt}
          />
        )}

        {showCancelModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border rounded-lg p-6 w-full max-w-sm flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Cancel workout?</h2>
              <p className="text-sm text-gray-400 dark:text-gray-300">
                This will permanently delete this workout session. This cannot
                be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-4 border rounded-lg hover:bg-white/5"
                >
                  Keep going
                </button>
                <button
                  type="button"
                  disabled={deleteSession.isPending}
                  onClick={async () => {
                    await deleteSession.mutateAsync(sessionId);
                    navigate({ to: "/my-logs" });
                  }}
                  className="flex-1 py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 disabled:opacity-40"
                >
                  {deleteSession.isPending ? "Cancelling..." : "Yes, cancel"}
                </button>
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    </FormProvider>
  );
}

// Ask when the workout ended if Finish is pressed this long after starting
const LATE_FINISH_HOURS = 3;

// <input type="datetime-local"> wants local time without a timezone
function toDateTimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type FinishChoice = "last" | "now" | "custom";

function FinishModal({
  onClose,
  onConfirm,
  isPending,
  startedAt,
  lastActivityAt,
}: {
  onClose: () => void;
  // completedAt is omitted when the workout ended just now
  onConfirm: (completedAt?: string) => void;
  isPending: boolean;
  startedAt: string;
  // when the session was last changed, e.g. a set was saved
  lastActivityAt?: string;
}) {
  const { setValue, register } = useFormContext<FormValues>();

  const [now] = useState(() => new Date());
  const started = new Date(startedAt);
  const isLate =
    now.getTime() - started.getTime() > LATE_FINISH_HOURS * 60 * 60 * 1000;
  const lastActivity =
    lastActivityAt && new Date(lastActivityAt) > started
      ? new Date(lastActivityAt)
      : undefined;

  const [choice, setChoice] = useState<FinishChoice>(
    lastActivity ? "last" : "custom",
  );
  const [custom, setCustom] = useState(() =>
    toDateTimeLocal(
      lastActivity ??
        new Date(Math.min(started.getTime() + 60 * 60 * 1000, now.getTime())),
    ),
  );
  const customDate = new Date(custom);
  const customInvalid =
    choice === "custom" &&
    (Number.isNaN(customDate.getTime()) ||
      customDate < started ||
      customDate > now);

  function finishTime(): string | undefined {
    if (!isLate || choice === "now") return undefined;
    if (choice === "last" && lastActivity) return lastActivity.toISOString();
    return customDate.toISOString();
  }
  const rating = useWatch<FormValues, "rating">({ name: "rating" });
  const feeling = useWatch<FormValues, "feeling">({ name: "feeling" });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-300 border rounded-lg p-6 w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-lg font-semibold">How was your workout?</h2>

        {isLate && (
          <div className="flex flex-col gap-2 rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-3">
            <p className="text-sm font-medium">When did you finish?</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              You started {formatDateTime(started)}, so this workout would be
              logged as lasting{" "}
              {Math.round((now.getTime() - started.getTime()) / 3_600_000)}{" "}
              hours.
            </p>
            <div className="flex flex-col gap-1.5">
              {lastActivity && (
                <FinishOption
                  selected={choice === "last"}
                  onSelect={() => setChoice("last")}
                  label="At my last activity"
                  hint={formatDateTime(lastActivity)}
                />
              )}
              <FinishOption
                selected={choice === "custom"}
                onSelect={() => setChoice("custom")}
                label="At another time"
              />
              {choice === "custom" && (
                <Input
                  type="datetime-local"
                  aria-label="Finish time"
                  value={custom}
                  min={toDateTimeLocal(started)}
                  max={toDateTimeLocal(now)}
                  onChange={(e) => setCustom(e.target.value)}
                  className="py-2"
                />
              )}
              <FinishOption
                selected={choice === "now"}
                onSelect={() => setChoice("now")}
                label="Just now"
              />
            </div>
            {customInvalid && (
              <p className="text-xs text-red-500">
                Pick a time between when you started and now.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-400 dark:text-gray-300 mb-2">
            Rating
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setValue("rating", n)}
                className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  rating === n
                    ? "bg-orange-500 border-orange-500 text-black"
                    : "border-white/20 hover:border-orange-400"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 dark:text-gray-300 mb-2">
            Feeling
          </label>
          <div className="flex gap-1 flex-wrap">
            {(["terrible", "bad", "okay", "good", "amazing"] as const).map(
              (f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setValue("feeling", f)}
                  className={`px-3 py-2 rounded-lg border text-sm capitalize transition-colors ${
                    feeling === f
                      ? "bg-orange-500 border-orange-500 text-black"
                      : "border-white/20 hover:border-orange-400"
                  }`}
                >
                  {f}
                </button>
              ),
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 dark:text-gray-300 mb-2">
            Notes
          </label>
          <Textarea
            rows={3}
            placeholder="Any notes about this session..."
            {...register("notes")}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 border rounded-lg hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(finishTime())}
            disabled={isPending || customInvalid}
            className="flex-1 py-4 bg-orange-500 text-black font-semibold rounded-lg hover:bg-orange-400 disabled:opacity-40"
          >
            {isPending ? "Saving..." : "Save & finish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FinishOption({
  selected,
  onSelect,
  label,
  hint,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
        selected
          ? "bg-orange-500 border-orange-500 text-black"
          : "border-gray-300 dark:border-white/20 hover:border-orange-400"
      }`}
    >
      {label}
      {hint && <span className="text-xs opacity-80">{hint}</span>}
    </button>
  );
}

function ProgressBar({
  session,
  totalSets,
}: {
  session: { exercises: WorkoutExercise[]; status: string };
  totalSets: number;
}) {
  const completedSets = session.exercises.reduce(
    (total, ex) => total + (ex.sets?.filter((s) => s.completed).length || 0),
    0,
  );

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-400 dark:text-gray-300 mb-1">
        <span className="capitalize">{session.status}</span>
        <span>
          {completedSets} / {totalSets} sets
        </span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2">
        <div
          className="bg-orange-500 h-2 rounded-full transition-all"
          style={{
            width:
              totalSets > 0 ? `${(completedSets / totalSets) * 100}%` : "0%",
          }}
        />
      </div>
    </div>
  );
}

// Set number pill: soft orange while to do, solid once completed
function SetBadge({
  completed,
  className,
  children,
}: {
  completed: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "shrink-0 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-colors",
        completed
          ? "bg-orange-500 text-white"
          : "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
        className,
      )}
    >
      {children}
    </span>
  );
}

// Weight increments (kg): micro-plates (0.25, 0.5, 1, 1.25), common
// dumbbell jumps (2, 2.5), plate pairs and selectorised stack pins (5–25),
// and a pair of 25s (50) for heavy compound lifts
const WEIGHT_STEPS_KG = [0.25, 0.5, 1, 1.25, 2, 2.5, 5, 10, 15, 20, 25, 50];

// Stepper: +/- buttons with a large tap area — no keyboard needed
function SetStepper({
  exerciseIndex,
  setIndex,
  field,
  step,
  defaultStep,
  steps,
  presets,
  min = 0,
}: {
  exerciseIndex: number;
  setIndex: number;
  field: keyof SetValues;
  step: number;
  defaultStep?: number;
  steps?: number[];
  presets?: number[];
  min?: number;
}) {
  const [activeStep, setActiveStep] = useState(defaultStep ?? step);
  const { setValue } = useFormContext<FormValues>();
  const name = `exercises.${exerciseIndex}.sets.${setIndex}.${field}` as const;
  // useWatch instead of local state so mobile + desktop layouts stay in sync
  const val: number = (useWatch({ name: name as string }) as number) ?? 0;

  const currentStep = steps ? activeStep : step;

  function dec() {
    setValue(
      name as unknown as Parameters<typeof setValue>[0],
      Math.max(min, parseFloat((val - currentStep).toFixed(2))),
    );
  }

  function inc() {
    setValue(
      name as unknown as Parameters<typeof setValue>[0],
      parseFloat((val + currentStep).toFixed(2)),
    );
  }

  // up to 2 decimals so micro-plate weights like 20.25 aren't rounded
  const display = formatNumber(val);

  return (
    <div className="flex-1 flex flex-col gap-1">
      <div className="flex items-center border rounded-lg h-14 overflow-hidden">
        <button
          type="button"
          onClick={dec}
          className="w-11 h-full border-r flex items-center justify-center text-2xl text-gray-400 dark:text-gray-300 select-none shrink-0 touch-manipulation transition-colors duration-150 active:duration-0 active:bg-orange-500 active:text-white"
        >
          −
        </button>
        <span className="flex-1 text-center font-semibold text-base select-none tabular-nums">
          {display}
        </span>
        <button
          type="button"
          onClick={inc}
          className="w-11 h-full border-l flex items-center justify-center text-2xl text-gray-400 dark:text-gray-300 select-none shrink-0 touch-manipulation transition-colors duration-150 active:duration-0 active:bg-orange-500 active:text-white"
        >
          +
        </button>
      </div>
      {steps && (
        <div className="grid grid-cols-6 lg:grid-cols-4 gap-1">
          {steps.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActiveStep(s)}
              className={`py-1 rounded text-xs font-medium h-11 lg:h-6 touch-manipulation transition-colors duration-150 active:duration-0 active:bg-orange-500 active:text-white active:border-orange-500 ${
                activeStep === s
                  ? "bg-orange-500 text-black"
                  : "border border-black text-gray-400 dark:text-gray-300 hover:border-orange-400"
              }`}
            >
              {formatNumber(s)}
            </button>
          ))}
        </div>
      )}
      {presets && (
        <div className="grid grid-cols-4 gap-1">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() =>
                setValue(name as unknown as Parameters<typeof setValue>[0], p)
              }
              className={`py-1 h-14 lg:h-6 rounded text-xs font-medium touch-manipulation transition-colors duration-150 active:duration-0 active:bg-orange-500 active:text-white active:border-orange-500 ${
                val === p
                  ? "bg-orange-500 text-black"
                  : "border border-black text-gray-400 dark:text-gray-300 hover:border-orange-400"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type ExerciseCardProps = {
  exercise: WorkoutExercise;
  exerciseIndex: number;
  sessionId: string;

  updateSet: ReturnType<typeof useUpdateExerciseSet>;
  deleteSet: ReturnType<typeof useDeleteExerciseSet>;
  initializedRef: React.MutableRefObject<boolean>;
  onRemove: () => void;
  isRemoving: boolean;
  // Full exercise record, for the details and how-to
  details?: Exercise;
  lastPerformance?: LastPerformance;
};

function ExerciseCard({
  exercise,
  exerciseIndex,
  sessionId,
  updateSet,
  deleteSet,
  initializedRef,
  onRemove,
  isRemoving,
  details,
  lastPerformance,
}: ExerciseCardProps) {
  const exerciseData = exercise.exercise as PopulatedExercise;
  const isCardio = exerciseData.category === "cardio";

  const { getValues, control } = useFormContext<FormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `exercises.${exerciseIndex}.sets`,
  });

  const [collapsed, setCollapsed] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentId = useId();
  const popoverId = useId();
  const expandedId = useId();
  const closeInfo = useCallback(() => setInfoOpen(false), []);
  useDismiss(cardRef, infoOpen, closeInfo);
  const [pendingDeleteSet, setPendingDeleteSet] = useState<number | null>(null);
  const [confirmRemoveExercise, setConfirmRemoveExercise] = useState(false);
  const [completedStates, setCompletedStates] = useState<boolean[]>(() =>
    (exercise.sets ?? []).map((s) => s.completed),
  );
  const [collapsedSets, setCollapsedSets] = useState<boolean[]>(() =>
    (exercise.sets ?? []).map((s) => s.completed),
  );

  const setsLength = exercise.sets?.length ?? 0;
  useEffect(() => {
    const sets = exercise.sets ?? [];
    setCompletedStates(sets.map((s) => s.completed));
    setCollapsedSets((prev) =>
      sets.map((s, i) => (i < prev.length ? prev[i] : s.completed)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setsLength]);

  function handleToggleCompleted(
    setIndex: number,
    setNumber: number,
    currentlyCompleted: boolean,
  ) {
    const newCompleted = !currentlyCompleted;
    setCompletedStates((prev) => {
      const next = [...prev];
      next[setIndex] = newCompleted;
      return next;
    });
    if (newCompleted) {
      setCollapsedSets((prev) => {
        const next = [...prev];
        next[setIndex] = true;
        return next;
      });
    }
    updateSet.mutateAsync({
      sessionId,
      exerciseIndex,
      setData: {
        setNumber,
        ...getValues(`exercises.${exerciseIndex}.sets.${setIndex}`),
        completed: newCompleted,
      },
    });
  }

  function handleAddSet() {
    const previousSet = exercise.sets?.[exercise.sets.length - 1];
    const newSetValues: SetValues = {
      reps: isCardio ? 0 : (previousSet?.reps ?? 5),
      weight: isCardio ? 0 : (previousSet?.weight ?? 0),
      durationInSeconds: isCardio ? (previousSet?.durationInSeconds ?? 60) : 0,
    };

    append(newSetValues);

    updateSet.mutateAsync({
      sessionId,
      exerciseIndex,
      setData: {
        setNumber: fields.length + 1,
        ...newSetValues,
        completed: false,
      },
    });
  }

  async function handleDeleteSet(setIndex: number, setNumber: number) {
    remove(setIndex);
    initializedRef.current = false;
    await deleteSet.mutateAsync({ sessionId, exerciseIndex, setNumber });
  }

  const allSetsCompleted =
    completedStates.length > 0 && completedStates.every(Boolean);

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative flex flex-col min-w-0 rounded-lg border bg-gray-50 dark:bg-zinc-900 transition-colors",
        allSetsCompleted
          ? "border-orange-500/70"
          : "border-gray-300 dark:border-zinc-700",
      )}
    >
      {/* Header: one line on phones */}
      <div className="flex items-center gap-1.5 md:gap-2 pl-1 pr-1 py-1.5">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-controls={contentId}
          className="flex-1 flex items-center gap-1.5 md:gap-2 min-w-0 py-1 pl-1 text-left"
        >
          <ChevronDownIcon
            size={16}
            aria-hidden="true"
            className={cn(
              "shrink-0 text-gray-400 transition-transform duration-150",
              collapsed && "-rotate-90",
            )}
          />
          <span className="size-5 md:size-6 shrink-0 grid place-items-center rounded-full bg-gray-200 dark:bg-zinc-800 text-[10px] md:text-xs font-semibold text-gray-600 dark:text-gray-300">
            {exerciseIndex + 1}
          </span>
          <h3 className="flex-1 min-w-0 truncate font-medium text-sm md:text-base capitalize">
            {exerciseData.name}
          </h3>
        </button>

        {confirmRemoveExercise ? (
          <>
            <button
              type="button"
              onClick={() => {
                setConfirmRemoveExercise(false);
                onRemove();
              }}
              disabled={isRemoving}
              className="px-2 h-8 shrink-0 rounded text-xs font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 transition-colors"
            >
              Remove
            </button>
            <button
              type="button"
              onClick={() => setConfirmRemoveExercise(false)}
              className="px-2 h-8 shrink-0 rounded text-xs text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <InfoButton
              name={exerciseData.name}
              open={infoOpen}
              onToggle={() => setInfoOpen((o) => !o)}
              controls={popoverId}
            />
            {exerciseData.mainTargetMuscle && (
              <MuscleTag
                muscle={exerciseData.mainTargetMuscle}
                className="max-w-20 md:max-w-none truncate"
              />
            )}
            {completedStates.length > 0 && (
              <span
                className={cn(
                  "shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
                  allSetsCompleted
                    ? "bg-orange-500 text-black"
                    : "bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:text-gray-300",
                )}
              >
                {completedStates.filter(Boolean).length}/
                {completedStates.length}
                <span className="sr-only"> sets done</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => setConfirmRemoveExercise(true)}
              disabled={isRemoving}
              aria-label={`Remove ${exerciseData.name}`}
              className="size-7 md:size-8 shrink-0 grid place-items-center rounded text-lg leading-none text-gray-400 dark:text-gray-300 hover:text-red-500 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
            >
              ×
            </button>
          </>
        )}
      </div>

      {infoOpen && (
        <ExerciseInfoPopover
          id={popoverId}
          name={exerciseData.name}
          category={exerciseData.category}
          details={details}
          lastPerformance={lastPerformance}
        />
      )}

      {/* Tablet and up: details and last time */}
      <p className="hidden md:block pl-[4.25rem] pr-3 pb-2 -mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
        <span className="capitalize">
          <ExerciseMeta category={exerciseData.category} details={details} />
        </span>
        {" · "}
        <LastPerformanceLine perf={lastPerformance} />
      </p>

      <Collapse open={!collapsed} id={contentId} className="px-3 pb-3 md:px-4">
        {/* Column labels — desktop only (mobile cards have inline labels) */}
        {fields.length > 0 && (
          <div className="hidden lg:flex items-center gap-2 mb-2 px-1">
            <span className="w-6 shrink-0" />
            {isCardio ? (
              <span className="flex-1 text-xs text-gray-400 dark:text-gray-300 text-center">
                Duration (s)
              </span>
            ) : (
              <>
                <span className="flex-1 text-xs text-gray-400 dark:text-gray-300 text-center">
                  Reps
                </span>
                <span className="flex-1 text-xs text-gray-400 dark:text-gray-300 text-center">
                  kg
                </span>
              </>
            )}
            <span className="w-14 shrink-0" />
            <span className="w-8 shrink-0" />
          </div>
        )}

        {/* Set rows */}
        <div className="flex flex-col gap-3 lg:gap-4 mb-4">
          {fields.map((field, setIndex) => {
            const serverSet = exercise.sets?.[setIndex];
            const setNumber = serverSet?.setNumber ?? setIndex + 1;
            const completed = completedStates[setIndex] ?? false;

            const setCollapsed = collapsedSets[setIndex] ?? false;

            return (
              <div key={field.id}>
                {/* ── Mobile card layout ── */}
                <div
                  className={`lg:hidden border rounded-lg shadow-sm transition-colors ${
                    completed
                      ? "bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30"
                      : "bg-white border-gray-200 dark:bg-zinc-800 dark:border-zinc-700"
                  }`}
                >
                  {/* Set header — always visible */}
                  <div className="flex items-center justify-between p-3">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedSets((prev) => {
                          const next = [...prev];
                          next[setIndex] = !next[setIndex];
                          return next;
                        })
                      }
                      className="flex items-center gap-2 text-sm font-semibold text-gray-400 dark:text-gray-300"
                    >
                      <span
                        className={`text-gray-500 text-xs transition-transform duration-150 ${setCollapsed ? "-rotate-90" : "rotate-0"}`}
                      >
                        ▼
                      </span>
                      <SetBadge completed={completed}>
                        Set {setNumber}
                        {completed && <span aria-hidden="true"> ✓</span>}
                      </SetBadge>
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleCompleted(setIndex, setNumber, completed)
                        }
                        className={`w-14 h-14 lg:w-10 lg:h-10 rounded-lg border-2 text-sm font-bold transition-colors ${
                          completed
                            ? "bg-orange-500 border-orange-500 text-black"
                            : "border-white/30 text-gray-400 dark:text-gray-300 hover:border-orange-400 active:bg-white/5"
                        }`}
                      >
                        ✓
                      </button>
                      {pendingDeleteSet === setIndex ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingDeleteSet(null);
                              handleDeleteSet(setIndex, setNumber);
                            }}
                            disabled={deleteSet.isPending}
                            className="px-2 h-10 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteSet(null)}
                            className="px-2 h-10 rounded-lg text-xs text-gray-400 dark:text-gray-300 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPendingDeleteSet(setIndex)}
                          disabled={deleteSet.isPending}
                          className="w-14 h-14 lg:w-10 lg:h-10 rounded-lg border border-red-500/40 text-red-500 text-lg hover:bg-red-500 hover:text-white active:bg-red-600 disabled:opacity-40 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Steppers — collapsible */}
                  <Collapse
                    open={!setCollapsed}
                    className="flex flex-col gap-3 px-3 pb-3"
                  >
                    {isCardio ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-400 dark:text-gray-300 text-center">
                          Duration (s)
                        </span>
                        <SetStepper
                          exerciseIndex={exerciseIndex}
                          setIndex={setIndex}
                          field="durationInSeconds"
                          step={5}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-400 dark:text-gray-300 text-center">
                            Reps
                          </span>
                          <SetStepper
                            exerciseIndex={exerciseIndex}
                            setIndex={setIndex}
                            field="reps"
                            step={1}
                            presets={[5, 6, 8, 12]}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-400 dark:text-gray-300 text-center">
                            kg
                          </span>
                          <SetStepper
                            exerciseIndex={exerciseIndex}
                            setIndex={setIndex}
                            field="weight"
                            step={2.5}
                            defaultStep={5}
                            steps={WEIGHT_STEPS_KG}
                          />
                        </div>
                      </>
                    )}
                  </Collapse>
                </div>

                {/* ── Desktop row layout ── */}
                <div
                  className={`hidden lg:flex items-center md:items-start gap-2 px-2 py-3 rounded-lg transition-colors ${
                    completed
                      ? "bg-orange-50 dark:bg-orange-500/10"
                      : setIndex % 2
                        ? "bg-gray-200/70 dark:bg-zinc-800"
                        : "bg-white dark:bg-zinc-950/40"
                  }`}
                >
                  <SetBadge completed={completed} className="w-7 mt-1">
                    {setNumber}
                  </SetBadge>

                  {isCardio ? (
                    <SetStepper
                      exerciseIndex={exerciseIndex}
                      setIndex={setIndex}
                      field="durationInSeconds"
                      step={5}
                    />
                  ) : (
                    <>
                      <SetStepper
                        exerciseIndex={exerciseIndex}
                        setIndex={setIndex}
                        field="reps"
                        step={1}
                        presets={[5, 6, 8, 12]}
                      />
                      <SetStepper
                        exerciseIndex={exerciseIndex}
                        setIndex={setIndex}
                        field="weight"
                        step={2.5}
                        defaultStep={5}
                        steps={WEIGHT_STEPS_KG}
                      />
                    </>
                  )}

                  <div className="flex gap-1 items-center justify-center h-full">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleCompleted(setIndex, setNumber, completed)
                      }
                      className={`w-14 h-14 shrink-0 rounded-lg border-2 text-sm font-bold transition-colors ${
                        completed
                          ? "bg-orange-500 border-orange-500 text-black"
                          : "border-white/30 text-gray-400 dark:text-gray-300 hover:border-orange-400 active:bg-white/5"
                      }`}
                    >
                      ✓
                    </button>

                    {pendingDeleteSet === setIndex ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingDeleteSet(null);
                            handleDeleteSet(setIndex, setNumber);
                          }}
                          disabled={deleteSet.isPending}
                          className="px-2 h-8 shrink-0 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteSet(null)}
                          className="px-2 h-8 shrink-0 rounded-lg text-xs text-gray-400 dark:text-gray-300 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteSet(setIndex)}
                        disabled={deleteSet.isPending}
                        className="w-8 h-8 shrink-0 rounded-lg border border-red-500/40 text-red-500 text-sm hover:bg-red-500 hover:text-white active:bg-red-600 disabled:opacity-40 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAddSet}
          disabled={updateSet.isPending}
          className="w-full h-14 border-2 border-dashed rounded-lg text-gray-400 dark:text-gray-300 hover:text-white hover:border-orange-400 font-medium transition-colors disabled:opacity-40"
        >
          + Add set
        </button>
      </Collapse>

      <ExerciseInfoToggle
        id={expandedId}
        expanded={expanded}
        onToggle={() => setExpanded((e) => !e)}
        details={details}
      />
    </div>
  );
}
