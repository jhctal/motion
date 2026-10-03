import {
  createFileRoute,
  redirect,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { useListExercises } from "../../api/exercises/use-list-exercises";
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

function ActiveLog() {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const sessionId = id ?? "";

  const { data: session, isLoading, error } = useWorkoutSession(sessionId);
  const { data: allExercises } = useListExercises();
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
            durationInSeconds: s.duration ?? 0,
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

  async function onFinish(data: FormValues) {
    await completeSession.mutateAsync({
      id: sessionId,
      rating: data.rating,
      feeling: data.feeling,
      notes: data.notes || undefined,
    });
    navigate({ to: "/my-logs" });
  }

  if (error) {
    return (
      <PageWrapper pageName="Error">
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

  const totalSets = session.exercises.reduce(
    (total, ex) => total + (ex.sets?.length || 0),
    0,
  );

  return (
    <FormProvider {...methods}>
      <PageWrapper pageName={session.name}>
        <ProgressBar session={session} totalSets={totalSets} />

        <div className="flex flex-col gap-6 mb-4">
          {session.exercises.map((exercise, exerciseIndex) => (
            <ExerciseCard
              key={(exercise.exercise as PopulatedExercise)._id + exerciseIndex}
              exercise={exercise}
              exerciseIndex={exerciseIndex}
              sessionId={sessionId}
              sessionCompleted={session.status === "completed"}
              updateSet={updateSet}
              deleteSet={deleteSet}
              initializedRef={initialized}
              onRemove={
                session.status !== "completed"
                  ? () => handleRemoveExercise(exerciseIndex)
                  : undefined
              }
              isRemoving={removeExercise.isPending}
            />
          ))}
        </div>

        {session.status !== "completed" && (
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
            onConfirm={handleSubmit(onFinish)}
            isPending={completeSession.isPending}
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

function FinishModal({
  onClose,
  onConfirm,
  isPending,
}: {
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const { setValue, register } = useFormContext<FormValues>();
  const rating = useWatch<FormValues, "rating">({ name: "rating" });
  const feeling = useWatch<FormValues, "feeling">({ name: "feeling" });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-300 border rounded-lg p-6 w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-lg font-semibold">How was your workout?</h2>

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
          <textarea
            rows={3}
            placeholder="Any notes about this session..."
            className="w-full p-3 border rounded-lg bg-transparent text-sm resize-none"
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
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-4 bg-orange-500 text-black font-semibold rounded-lg hover:bg-orange-400 disabled:opacity-40"
          >
            {isPending ? "Saving..." : "Save & finish"}
          </button>
        </div>
      </div>
    </div>
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

  const display = Number.isInteger(val) ? String(val) : val.toFixed(1);

  return (
    <div className="flex-1 flex flex-col gap-1">
      <div className="flex items-center border rounded-lg h-14 overflow-hidden">
        <button
          type="button"
          onClick={dec}
          className="w-11 h-full border-r flex items-center justify-center text-2xl text-gray-400 dark:text-gray-300 active:bg-white/10 select-none shrink-0"
        >
          −
        </button>
        <span className="flex-1 text-center font-semibold text-base select-none tabular-nums">
          {display}
        </span>
        <button
          type="button"
          onClick={inc}
          className="w-11 h-full border-l flex items-center justify-center text-2xl text-gray-400 dark:text-gray-300 active:bg-white/10 select-none shrink-0"
        >
          +
        </button>
      </div>
      {steps && (
        <div className="grid grid-cols-4 gap-1">
          {steps.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActiveStep(s)}
              className={`py-1 rounded text-xs font-medium transition-colors ${
                activeStep === s
                  ? "bg-orange-500 text-black"
                  : "border border-black text-gray-400 dark:text-gray-300 hover:border-orange-400"
              }`}
            >
              {Number.isInteger(s) ? s : s.toFixed(1)}
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
              className={`py-1 rounded text-xs font-medium transition-colors ${
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
  sessionCompleted: boolean;
  updateSet: ReturnType<typeof useUpdateExerciseSet>;
  deleteSet: ReturnType<typeof useDeleteExerciseSet>;
  initializedRef: React.MutableRefObject<boolean>;
  onRemove?: () => void;
  isRemoving?: boolean;
};

function ExerciseCard({
  exercise,
  exerciseIndex,
  sessionId,
  sessionCompleted,
  updateSet,
  deleteSet,
  initializedRef,
  onRemove,
  isRemoving,
}: ExerciseCardProps) {
  const exerciseData = exercise.exercise as PopulatedExercise;
  const isCardio = exerciseData.category === "cardio";

  const { getValues, control } = useFormContext<FormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `exercises.${exerciseIndex}.sets`,
  });

  const [collapsed, setCollapsed] = useState(true);
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
      durationInSeconds: isCardio ? (previousSet?.duration ?? 60) : 0,
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
    <div className="border rounded-lg p-4">
      {/* Exercise header */}
      <div
        className={`flex items-center justify-between transition-all duration-150 ${collapsed ? "" : "mb-4"}`}
      >
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex-1 flex items-center gap-2 text-left min-w-0"
        >
          <span
            className={`text-gray-400 dark:text-gray-300 text-xs transition-transform duration-200 shrink-0 ${collapsed ? "-rotate-90" : "rotate-0"}`}
          >
            ▼
          </span>
          <div className="min-w-0">
            <h3
              className={`font-semibold text-base capitalize truncate ${allSetsCompleted ? "text-orange-400" : ""}`}
            >
              {exerciseData.name}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-300 capitalize mt-0.5">
              {exerciseData.mainTargetMuscle}
              {collapsed && completedStates.length > 0 && (
                <span className="ml-2">
                  · {completedStates.filter(Boolean).length}/
                  {completedStates.length} sets
                </span>
              )}
            </p>
          </div>
        </button>
        {onRemove && !collapsed && (
          <div className="ml-3 shrink-0 flex items-center gap-1">
            {confirmRemoveExercise ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmRemoveExercise(false);
                    onRemove();
                  }}
                  disabled={isRemoving}
                  className="px-2 h-8 rounded text-xs font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 transition-colors"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemoveExercise(false)}
                  className="px-2 h-8 rounded text-xs text-gray-400 dark:text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRemoveExercise(true)}
                disabled={isRemoving}
                className="w-10 h-10 flex items-center lg:items-start justify-center text-gray-400 dark:text-gray-300 hover:text-red-400 text-2xl disabled:opacity-40 transition-colors"
                title="Remove exercise"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>

      {!collapsed && (
        <>
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
              {!sessionCompleted && <span className="w-8 shrink-0" />}
            </div>
          )}

          {/* Set rows */}
          <div className="flex flex-col gap-2 mb-3">
            {fields.map((field, setIndex) => {
              const serverSet = exercise.sets?.[setIndex];
              const setNumber = serverSet?.setNumber ?? setIndex + 1;
              const completed = completedStates[setIndex] ?? false;

              const setCollapsed = collapsedSets[setIndex] ?? false;

              return (
                <div key={field.id}>
                  {/* ── Mobile card layout ── */}
                  <div
                    className={`lg:hidden border rounded-lg transition-colors ${
                      completed ? "bg-orange-500/10 border-orange-500/30" : ""
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
                          className={`text-gray-500 text-xs transition-transform duration-200 ${setCollapsed ? "-rotate-90" : "rotate-0"}`}
                        >
                          ▼
                        </span>
                        Set {setNumber}
                        {setCollapsed && completed && (
                          <span className="text-orange-400 text-xs font-normal ml-1">
                            ✓
                          </span>
                        )}
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={sessionCompleted}
                          type="button"
                          onClick={() =>
                            handleToggleCompleted(
                              setIndex,
                              setNumber,
                              completed,
                            )
                          }
                          className={`w-10 h-10 rounded-lg border-2 text-sm font-bold transition-colors ${
                            completed
                              ? "bg-orange-500 border-orange-500 text-black"
                              : "border-white/30 text-gray-400 dark:text-gray-300 hover:border-orange-400 active:bg-white/5"
                          }`}
                        >
                          ✓
                        </button>
                        {!sessionCompleted &&
                          (pendingDeleteSet === setIndex ? (
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
                              className="w-10 h-10 rounded-lg border border-red-500/40 text-red-500 text-lg hover:bg-red-500 hover:text-white active:bg-red-600 disabled:opacity-40 transition-colors"
                            >
                              ✕
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Steppers — collapsible */}
                    {!setCollapsed && (
                      <div className="flex flex-col gap-3 px-3 pb-3">
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
                                steps={[0.5, 1, 2.5, 5, 10, 15, 20, 25]}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Desktop row layout ── */}
                  <div
                    className={`hidden lg:flex items-center md:items-start gap-2 px-1 py-1 rounded-lg transition-colors ${
                      completed ? "bg-orange-500/10" : ""
                    }`}
                  >
                    <span className="w-6 shrink-0 text-sm font-medium text-gray-400 dark:text-gray-300 text-center">
                      {setNumber}
                    </span>

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
                          steps={[0.5, 1, 2.5, 5, 10, 15, 20, 25]}
                        />
                      </>
                    )}

                    <div className="flex gap-1 items-center justify-center h-full">
                      <button
                        disabled={sessionCompleted}
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

                      {!sessionCompleted &&
                        (pendingDeleteSet === setIndex ? (
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
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!sessionCompleted && (
            <button
              type="button"
              onClick={handleAddSet}
              disabled={updateSet.isPending}
              className="w-full h-14 border-2 border-dashed rounded-lg text-gray-400 dark:text-gray-300 hover:text-white hover:border-orange-400 font-medium transition-colors disabled:opacity-40"
            >
              + Add set
            </button>
          )}
        </>
      )}
    </div>
  );
}
