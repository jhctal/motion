import { useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ChevronRightIcon,
  ClockIcon,
  GlobeIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "lucide-react";
import useUserProfile from "../../api/user/use-user-profile";
import { useApproveWorkout } from "../../api/workouts/use-approve-workout";
import { useDeleteWorkout } from "../../api/workouts/use-delete-workout";
import useListWorkouts, { Workout } from "../../api/workouts/use-list-workouts";
import { usePendingWorkouts } from "../../api/workouts/use-pending-workouts";
import Button from "../../ui/button/button";
import Input from "../../ui/form/input";
import Select from "../../ui/form/select";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";
import MuscleTag from "../../ui/muscle-tag";
import { DifficultyMeter } from "../../ui/exercise-badges";
import { Skeleton } from "../../ui/widgets/widget-card";

export const Route = createFileRoute("/workouts/")({
  beforeLoad: async ({ location }) => {
    const user = localStorage.getItem("user");
    if (!user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
  },
  component: WorkoutIndex,
});

const ALL = "all";
const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

// Target muscles of a template's exercises, most-used first
function musclesOf(workout: Workout) {
  const counts = new Map<string, number>();
  for (const te of workout.exercises) {
    const m = te.exercise?.mainTargetMuscle;
    if (m) counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([m]) => m);
}

function WorkoutIndex() {
  const { data: profile } = useUserProfile();
  const { data: workouts, isLoading } = useListWorkouts();
  const { data: pending } = usePendingWorkouts();
  const approve = useApproveWorkout();
  const remove = useDeleteWorkout();

  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState(ALL);
  const [difficulty, setDifficulty] = useState(ALL);

  const isAdmin = profile?.isAdmin ?? false;
  const all = useMemo(() => workouts ?? [], [workouts]);

  const muscles = useMemo(
    () => [...new Set(all.flatMap(musclesOf))].sort(),
    [all],
  );

  const visible = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return all
      .filter((w) => {
        if (difficulty !== ALL && w.difficultyLevel !== difficulty)
          return false;
        if (muscle !== ALL && !musclesOf(w).includes(muscle)) return false;
        const haystack = [
          w.name,
          w.description ?? "",
          ...w.exercises.map((te) => te.exercise?.name ?? ""),
        ]
          .join(" ")
          .toLowerCase();
        return words.every((word) => haystack.includes(word));
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [all, query, muscle, difficulty]);

  const filtering = query !== "" || muscle !== ALL || difficulty !== ALL;

  function clearFilters() {
    setQuery("");
    setMuscle(ALL);
    setDifficulty(ALL);
  }

  return (
    <PageWrapper pageName="Workouts">
      <div className="flex flex-col gap-6 mt-1">
        <p className="-mt-1 text-sm text-gray-500 dark:text-gray-400">
          {filtering
            ? `Showing ${visible.length} of ${all.length} workouts`
            : `${all.length} workout templates`}
        </p>

        {/* Pending approval — admin only */}
        {isAdmin && pending && pending.length > 0 && (
          <section className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-500/30 dark:bg-amber-500/5">
            <h2 className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
              <ShieldCheckIcon size={16} aria-hidden="true" />
              Waiting for approval
              <span className="rounded-full bg-amber-200/70 px-2 text-xs dark:bg-amber-500/20">
                {pending.length}
              </span>
            </h2>
            <ul className="flex flex-col gap-2">
              {pending.map((workout) => (
                <PendingWorkoutRow
                  key={workout._id}
                  workout={workout}
                  onApprove={() => approve.mutate(workout._id)}
                  onReject={() => remove.mutate(workout._id)}
                  isApproving={approve.isPending}
                  isRejecting={remove.isPending}
                />
              ))}
            </ul>
          </section>
        )}

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              type="search"
              aria-label="Search workouts"
              placeholder="Search by name or exercise"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* side by side on phones, inline with search from sm up */}
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <div className="sm:w-44">
              <Select
                aria-label="Filter by muscle"
                value={muscle}
                onChange={(e) => setMuscle(e.target.value)}
                className="capitalize"
              >
                <option value={ALL}>All muscles</option>
                {muscles.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:w-40">
              <Select
                aria-label="Filter by difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value={ALL}>All levels</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <Link to="/workouts/new" className="sm:self-stretch">
            <Button className="w-full h-full min-h-11 gap-1.5">
              <PlusIcon size={16} aria-hidden="true" />
              New workout
            </Button>
          </Link>
        </div>

        {/* Templates */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 py-12 text-center dark:border-zinc-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filtering
                ? "No workouts match your filters"
                : "No workout templates yet"}
            </p>
            {filtering ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Link to="/workouts/new">
                <Button size="sm">Create your first workout</Button>
              </Link>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {visible.map((workout) => (
              <li key={workout._id} className="min-w-0">
                <WorkoutCard
                  workout={workout}
                  isAdmin={isAdmin}
                  onDelete={() => remove.mutate(workout._id)}
                  isDeleting={remove.isPending}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageWrapper>
  );
}

function PendingWorkoutRow({
  workout,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  workout: {
    _id: string;
    name: string;
    difficultyLevel?: string;
    estimatedDurationMinutes?: number;
    exercises: unknown[];
    user: { first_name: string; last_name: string };
  };
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <p className="font-medium capitalize text-sm text-gray-900 dark:text-white">
          {workout.name}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          <DifficultyMeter level={workout.difficultyLevel} />
          {workout.estimatedDurationMinutes && (
            <span>{workout.estimatedDurationMinutes} min</span>
          )}
          <span>{workout.exercises.length} exercises</span>
          <span className="text-gray-400">
            by {workout.user.first_name} {workout.user.last_name}
          </span>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        {confirming ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirming(false)}
            >
              Keep
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isRejecting}
              onClick={() => {
                onReject();
                setConfirming(false);
              }}
            >
              {isRejecting ? "Rejecting…" : "Reject"}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirming(true)}
              className="text-red-600 dark:text-red-400"
            >
              Reject
            </Button>
            <Button size="sm" disabled={isApproving} onClick={onApprove}>
              Approve
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

function WorkoutCard({
  workout,
  isAdmin,
  onDelete,
  isDeleting,
}: {
  workout: Workout;
  isAdmin: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const muscles = musclesOf(workout);
  const shownMuscles = muscles.slice(0, 3);

  return (
    <div className="group h-full flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-orange-500/50">
      <Link
        to="/workouts/$id"
        params={{ id: workout._id }}
        className="flex-1 flex flex-col gap-3 p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold capitalize leading-snug text-gray-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
            {workout.name}
          </h3>
          <ChevronRightIcon
            size={16}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-500 dark:text-zinc-600"
          />
        </div>

        {workout.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {workout.description}
          </p>
        )}

        {shownMuscles.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {shownMuscles.map((m) => (
              <MuscleTag key={m} muscle={m} />
            ))}
            {muscles.length > shownMuscles.length && (
              <span className="text-xs text-gray-400">
                +{muscles.length - shownMuscles.length}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-gray-500 dark:text-gray-400">
          <DifficultyMeter level={workout.difficultyLevel} />
          {workout.estimatedDurationMinutes && (
            <span className="inline-flex items-center gap-1">
              <ClockIcon size={12} aria-hidden="true" />
              {workout.estimatedDurationMinutes} min
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <ListIcon size={12} aria-hidden="true" />
            {workout.exercises.length} exercise
            {workout.exercises.length === 1 ? "" : "s"}
          </span>
          {workout.isPublic && (
            <span className="ml-auto inline-flex items-center gap-1">
              <GlobeIcon size={12} aria-hidden="true" />
              Public
            </span>
          )}
        </div>
      </Link>

      {isAdmin &&
        (confirming ? (
          <div className="flex items-center gap-2 border-t border-gray-100 px-3 py-2 dark:border-zinc-800">
            <span className="mr-auto text-xs text-gray-500 dark:text-gray-400">
              Delete this workout?
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirming(false)}
            >
              Keep
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={() => {
                onDelete();
                setConfirming(false);
              }}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        ) : (
          <div className="flex border-t border-gray-100 text-xs dark:border-zinc-800">
            <Link
              to="/workouts/$id"
              params={{ id: workout._id }}
              className="flex-1 py-2.5 text-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex-1 border-l border-gray-100 py-2.5 text-center text-red-600 hover:bg-red-50 dark:border-zinc-800 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
          </div>
        ))}
    </div>
  );
}

export default WorkoutIndex;
