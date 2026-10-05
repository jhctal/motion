import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import useUserProfile from "../../api/user/use-user-profile";
import { useApproveWorkout } from "../../api/workouts/use-approve-workout";
import { useDeleteWorkout } from "../../api/workouts/use-delete-workout";
import useListWorkouts, { Workout } from "../../api/workouts/use-list-workouts";
import { usePendingWorkouts } from "../../api/workouts/use-pending-workouts";
import Button from "../../ui/button/button";

export const Route = createFileRoute("/workouts/")({
  beforeLoad: async ({ location }) => {
    const user = localStorage.getItem("user");
    if (!user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
  },
  component: WorkoutIndex,
});

const difficultyColour: Record<string, string> = {
  beginner: "bg-green-900 text-green-300",
  intermediate: "bg-yellow-900 text-yellow-300",
  advanced: "bg-red-900 text-red-300",
};

function DifficultyBadge({ level }: { level?: string }) {
  if (!level) return null;
  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded capitalize ${difficultyColour[level] ?? "bg-gray-700 text-gray-300"}`}
    >
      {level}
    </span>
  );
}

function WorkoutIndex() {
  const { data: profile } = useUserProfile();
  const { data: workouts } = useListWorkouts();
  const { data: pending } = usePendingWorkouts();
  const approve = useApproveWorkout();
  const remove = useDeleteWorkout();

  const isAdmin = profile?.isAdmin ?? false;

  return (
    <div className="p-3 flex flex-col gap-6">
      {/* Pending approval — admin only */}
      {isAdmin && pending && pending.length > 0 && (
        <section>
          <p className="text-sm font-medium mb-2 text-orange-400">
            Pending approval ({pending.length})
          </p>
          <div className="flex flex-col gap-2">
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
          </div>
        </section>
      )}

      {/* All workouts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400 dark:text-gray-300">
            {workouts?.length ?? 0} workouts
          </span>
          <Link to="/workouts/new">
            <Button>+ New workout</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {workouts?.map((workout) => (
            <WorkoutCard
              key={workout._id}
              workout={workout}
              isAdmin={isAdmin}
              onDelete={() => remove.mutate(workout._id)}
              isDeleting={remove.isPending}
            />
          ))}
        </div>
      </section>
    </div>
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
    <div className="border rounded-lg p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-semibold capitalize text-sm">{workout.name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-300 capitalize mt-0.5">
          {workout.difficultyLevel} · {workout.estimatedDurationMinutes} mins ·{" "}
          {workout.exercises.length} exercises
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {workout.user.first_name} {workout.user.last_name}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={onApprove}
          disabled={isApproving}
          className="px-3 py-1.5 bg-orange-500 text-black text-xs font-semibold rounded-lg hover:bg-orange-400 disabled:opacity-40"
        >
          Approve
        </button>
        {confirming ? (
          <>
            <button
              onClick={() => setConfirming(false)}
              className="px-3 py-1.5 border text-xs text-gray-400 dark:text-gray-300 rounded-lg hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onReject();
                setConfirming(false);
              }}
              disabled={isRejecting}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-500 disabled:opacity-40"
            >
              {isRejecting ? "…" : "Confirm"}
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="px-3 py-1.5 border border-red-500 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-500/10"
          >
            Reject
          </button>
        )}
      </div>
    </div>
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

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col">
      <Link
        to="/workouts/$id"
        params={{ id: workout._id }}
        className="flex-1 p-4 flex flex-col gap-2 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold capitalize leading-tight">
            {workout.name}
          </h3>
          <DifficultyBadge level={workout.difficultyLevel} />
        </div>

        {workout.description && (
          <p className="text-xs text-gray-400 dark:text-gray-300 line-clamp-2">
            {workout.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-300 mt-auto pt-1">
          {workout.estimatedDurationMinutes && (
            <span>{workout.estimatedDurationMinutes} min</span>
          )}
          {workout.exercises.length > 0 && (
            <span>{workout.exercises.length} exercises</span>
          )}
          {workout.isPublic && (
            <span className="ml-auto text-gray-500">Public</span>
          )}
        </div>
      </Link>

      {isAdmin &&
        (confirming ? (
          <div className="border-t flex items-center gap-2 px-3 py-2">
            <span className="text-xs text-gray-400 dark:text-gray-300 mr-auto">
              Delete workout?
            </span>
            <button
              onClick={() => setConfirming(false)}
              className="px-3 py-1.5 text-xs text-gray-400 dark:text-gray-300 border rounded-lg hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onDelete();
                setConfirming(false);
              }}
              disabled={isDeleting}
              className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-40"
            >
              {isDeleting ? "Deleting…" : "Yes, delete"}
            </button>
          </div>
        ) : (
          <div className="border-t flex">
            <Link
              to="/workouts/$id"
              params={{ id: workout._id }}
              className="flex-1 py-2.5 text-center text-xs text-gray-400 dark:text-gray-300 hover:bg-white/5 transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={() => setConfirming(true)}
              className="flex-1 py-2.5 text-center text-xs text-red-500 border-l hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
          </div>
        ))}
    </div>
  );
}
