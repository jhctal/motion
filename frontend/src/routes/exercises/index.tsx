import { useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ChevronRightIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from "lucide-react";
import useUserProfile from "../../api/user/use-user-profile";
import { useApproveExercise } from "../../api/exercises/use-approve-exercise";
import { useDeleteExercise } from "../../api/exercises/use-delete-exercise";
import {
  Exercise,
  useListExercises,
} from "../../api/exercises/use-list-exercises";
import { usePendingExercises } from "../../api/exercises/use-pending-exercises";
import Button from "../../ui/button/button";
import Input from "../../ui/form/input";
import Select from "../../ui/form/select";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";
import MuscleTag from "../../ui/muscle-tag";
import {
  CategoryIcon,
  CompoundBadge,
  DifficultyMeter,
} from "../../ui/exercise-badges";
import { Skeleton } from "../../ui/widgets/widget-card";
import cn from "../../utils/cn";

export const Route = createFileRoute("/exercises/")({
  beforeLoad: async ({ location }) => {
    const user = localStorage.getItem("user");
    if (!user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
  },
  component: ExerciseIndex,
});

const ALL = "all";

function ExerciseIndex() {
  const { data: profile } = useUserProfile();
  const { data: exercises, isLoading } = useListExercises();
  const { data: pending } = usePendingExercises({ enabled: profile?.isAdmin });
  const approve = useApproveExercise();
  const remove = useDeleteExercise();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [muscle, setMuscle] = useState(ALL);

  const isAdmin = profile?.isAdmin ?? false;
  const all = useMemo(() => exercises ?? [], [exercises]);

  const muscles = useMemo(
    () =>
      [...new Set(all.map((ex) => ex.mainTargetMuscle).filter(Boolean))].sort(),
    [all],
  );

  // Search and muscle filter first, so category chips can show live counts
  const searched = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return all.filter((ex) => {
      if (muscle !== ALL && ex.mainTargetMuscle !== muscle) return false;
      const haystack = [
        ex.name,
        ex.mainTargetMuscle,
        ...(ex.equipmentNeeded ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return words.every((w) => haystack.includes(w));
    });
  }, [all, query, muscle]);

  const categoryCounts = searched.reduce<Record<string, number>>((acc, ex) => {
    const key = ex.category ?? "other";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const categories = Object.keys(categoryCounts).sort();

  const visible =
    category === ALL
      ? searched
      : searched.filter((ex) => (ex.category ?? "other") === category);
  const grouped = visible.reduce<Record<string, Exercise[]>>((acc, ex) => {
    (acc[ex.category ?? "other"] ??= []).push(ex);
    return acc;
  }, {});
  const filtering = query !== "" || category !== ALL || muscle !== ALL;

  function clearFilters() {
    setQuery("");
    setCategory(ALL);
    setMuscle(ALL);
  }

  return (
    <PageWrapper pageName="Exercises">
      <div className="flex flex-col gap-6 mt-1">
        <p className="-mt-1 text-sm text-gray-500 dark:text-gray-400">
          {filtering
            ? `Showing ${visible.length} of ${all.length} exercises`
            : `${all.length} exercises in the library`}
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
            </ul>
          </section>
        )}

        {/* Search and filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                type="search"
                aria-label="Search exercises"
                placeholder="Search by name, muscle or equipment"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="sm:w-48">
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
            <Link to="/exercises/new" className="sm:self-stretch">
              <Button className="w-full h-full min-h-11 gap-1.5">
                <PlusIcon size={16} aria-hidden="true" />
                New exercise
              </Button>
            </Link>
          </div>

          <div
            className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
            role="group"
            aria-label="Category"
          >
            {[ALL, ...categories].map((c) => {
              const active = category === c;
              const count = c === ALL ? searched.length : categoryCounts[c];
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm capitalize transition-colors",
                    active
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-gray-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-300 dark:hover:text-white",
                  )}
                >
                  {c !== ALL && <CategoryIcon category={c} size={14} />}
                  {c === ALL ? "All" : c}
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      active ? "text-orange-100" : "text-gray-400",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Library */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 py-12 text-center dark:border-zinc-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No exercises match your filters
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          Object.keys(grouped)
            .sort()
            .map((c) => (
              <section key={c} className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold capitalize text-gray-900 dark:text-white">
                  <span className="size-7 grid place-items-center rounded-lg bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400">
                    <CategoryIcon category={c} size={15} />
                  </span>
                  {c}
                  <span className="font-normal text-gray-400">
                    {grouped[c].length}
                  </span>
                </h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {grouped[c]
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((exercise) => (
                      <li key={exercise._id} className="min-w-0">
                        <ExerciseCard exercise={exercise} />
                      </li>
                    ))}
                </ul>
              </section>
            ))
        )}
      </div>
    </PageWrapper>
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
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <p className="font-medium capitalize text-sm text-gray-900 dark:text-white">
          {ex.name}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {ex.mainTargetMuscle && <MuscleTag muscle={ex.mainTargetMuscle} />}
          <span className="text-xs capitalize text-gray-500 dark:text-gray-400">
            {ex.category}
          </span>
          <DifficultyMeter level={ex.difficulty} />
          <span className="text-xs text-gray-400">
            by {ex.user.first_name} {ex.user.last_name}
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

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const equipment = exercise.equipmentNeeded ?? [];
  return (
    <Link
      to="/exercises/$id"
      params={{ id: exercise._id }}
      className="group h-full flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-orange-500/50"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold capitalize leading-snug text-gray-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
          {exercise.name}
        </h3>
        <ChevronRightIcon
          size={16}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-500 dark:text-zinc-600"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {exercise.mainTargetMuscle && (
          <MuscleTag muscle={exercise.mainTargetMuscle} />
        )}
        {exercise.isCompound && <CompoundBadge />}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <DifficultyMeter level={exercise.difficulty} />
        {equipment.length > 0 && (
          <span className="flex min-w-0 items-center gap-1 text-xs capitalize text-gray-500 dark:text-gray-400">
            <WrenchIcon size={12} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{equipment.join(", ")}</span>
          </span>
        )}
      </div>
    </Link>
  );
}

export default ExerciseIndex;
