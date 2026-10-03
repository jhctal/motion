import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import useUserProfile from "../../api/user/use-user-profile";
import { useApproveExercise } from "../../api/exercises/use-approve-exercise";
import { useDeleteExercise } from "../../api/exercises/use-delete-exercise";
import {
  Exercise,
  useListExercises,
} from "../../api/exercises/use-list-exercises";
import { usePendingExercises } from "../../api/exercises/use-pending-exercises";

export const Route = createFileRoute("/exercises/")({
  beforeLoad: async ({ location }) => {
    const user = localStorage.getItem("user");
    if (!user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
  },
  component: ExerciseIndex,
});

const difficultyColour: Record<string, string> = {
  beginner: "bg-green-900 text-green-300",
  intermediate: "bg-yellow-900 text-yellow-300",
  advanced: "bg-red-900 text-red-300",
};

const categoryColour: Record<string, string> = {
  strength: "bg-blue-900 text-blue-300",
  cardio: "bg-pink-900 text-pink-300",
  flexibility: "bg-purple-900 text-purple-300",
  balance: "bg-teal-900 text-teal-300",
};

function ExerciseIndex() {
  const { data: profile } = useUserProfile();
  const { data: exercises } = useListExercises();
  const { data: pending } = usePendingExercises({ enabled: profile?.isAdmin });
  const approve = useApproveExercise();
  const remove = useDeleteExercise();

  const isAdmin = profile?.isAdmin ?? false;

  // Group approved exercises by category
  const grouped = (exercises ?? []).reduce<Record<string, Exercise[]>>(
    (acc, ex) => {
      const key = ex.category ?? "other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(ex);
      return acc;
    },
    {},
  );
  const categories = Object.keys(grouped).sort();

  return (
    <div className="p-3 flex flex-col gap-6">
      {/* Pending approval — admin only */}
      {isAdmin && pending && pending.length > 0 && (
        <section>
          <p className="text-sm font-medium mb-2 text-orange-400">
            Pending approval ({pending.length})
          </p>
          <div className="flex flex-col gap-2">
            {pending.map((ex) => (
              <PendingExerciseRow
                key={ex._id}
                ex={ex}
                onApprove={() => approve.mutate(ex._id)}
                onReject={() => remove.mutate(ex._id)}
                isApproving={approve.isPending}
                isRejecting={remove.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* Exercises grouped by category */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400 dark:text-gray-300">
            {exercises?.length ?? 0} exercises
          </span>
          <Link
            to="/exercises/new"
            className="px-3 py-1.5 bg-orange-500 text-black text-sm font-semibold rounded-lg hover:bg-orange-400"
          >
            + New exercise
          </Link>
        </div>

        {categories.map((category) => (
          <div key={category}>
            <h2 className="text-sm font-semibold capitalize text-gray-300 mb-2">
              {category}
              <span className="text-gray-500 font-normal ml-1.5">
                ({grouped[category].length})
              </span>
            </h2>
            {/* 1 col on mobile, 2 on md, 3 on lg */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {grouped[category].map((exercise) => (
                <ExerciseCard key={exercise._id} exercise={exercise} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function PendingExerciseRow({
  ex,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  ex: {
    _id: string;
    name: string;
    category?: string;
    mainTargetMuscle?: string;
    difficulty?: string;
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
        <p className="font-semibold capitalize text-sm">{ex.name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-300 capitalize mt-0.5">
          {ex.category} · {ex.mainTargetMuscle} · {ex.difficulty}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {ex.user.first_name} {ex.user.last_name}
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

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Link
      to="/exercises/$id"
      params={{ id: exercise._id }}
      className="border rounded-lg p-4 flex flex-col gap-2 hover:bg-white/5 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold capitalize leading-tight text-sm">
          {exercise.name}
        </h3>
        {exercise.difficulty && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded capitalize shrink-0 ${difficultyColour[exercise.difficulty] ?? "bg-gray-700 text-gray-300"}`}
          >
            {exercise.difficulty}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {exercise.category && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded capitalize ${categoryColour[exercise.category] ?? "bg-gray-700 text-gray-300"}`}
          >
            {exercise.category}
          </span>
        )}
        {exercise.mainTargetMuscle && (
          <span className="text-xs px-1.5 py-0.5 rounded capitalize bg-gray-800 text-gray-300">
            {exercise.mainTargetMuscle}
          </span>
        )}
        {exercise.isCompound && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-900 text-orange-300">
            Compound
          </span>
        )}
      </div>

      {exercise.equipmentNeeded && exercise.equipmentNeeded.length > 0 && (
        <p className="text-xs text-gray-500 capitalize">
          {exercise.equipmentNeeded.join(", ")}
        </p>
      )}
    </Link>
  );
}

export default ExerciseIndex;
