import {
  createFileRoute,
  Link,
  redirect,
  useParams,
} from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  HistoryIcon,
  ListOrderedIcon,
  MedalIcon,
  PlusIcon,
  WrenchIcon,
} from "lucide-react";
import useFindExercise from "../../api/exercises/use-find-exercise";
import { useExercisePersonalRecords } from "../../api/personal-records/use-personal-records";
import useTrainingHistory from "../../api/workouts/use-training-history";
import type { PersonalRecord } from "../../api/workout-types";
import PageWrapper from "../../ui/page-wrapper/page-wrapper";
import Button from "../../ui/button/button";
import MuscleTag from "../../ui/muscle-tag";
import BodyMap from "../../ui/body-map";
import { LastPerformanceLine } from "../../ui/exercise-info";
import { ExerciseImages } from "../../ui/exercise-images";
import {
  CategoryIcon,
  CompoundBadge,
  DifficultyMeter,
} from "../../ui/exercise-badges";
import { Skeleton, WidgetCard } from "../../ui/widgets/widget-card";
import { formatDate, formatNumber } from "../../utils/format-date";

export const Route = createFileRoute("/exercises/$id")({
  beforeLoad: async ({ location }) => {
    const user = localStorage.getItem("user");

    if (!user) {
      throw redirect({
        to: "/auth",
        search: {
          // Use the current location to power a redirect after login
          // (Do not use `router.state.resolvedLocation` as it can
          // potentially lag behind the actual current location)
          redirect: location.href,
        },
      });
    }
  },
  component: ExerciseView,
});

const RECORD_LABELS: Partial<Record<PersonalRecord["recordType"], string>> = {
  "max-weight": "Heaviest weight",
  "1rm": "Estimated 1RM",
  "max-volume": "Best set volume",
  "max-reps": "Most reps",
  "longest-duration": "Longest set",
};

// Instructions are stored as free text; show numbered steps when it has lines
function toSteps(instructions?: string) {
  return (instructions ?? "")
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(\d+[.)]|[-•*])\s*/, "").trim())
    .filter(Boolean);
}

function BackLink() {
  return (
    <Link
      to="/exercises"
      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400"
    >
      <ArrowLeftIcon size={14} aria-hidden="true" />
      All exercises
    </Link>
  );
}

function ExerciseView() {
  const { id = "" } = useParams({ strict: false });
  const { data, isLoading, error } = useFindExercise(id);
  const { data: records } = useExercisePersonalRecords(id);
  const history = useTrainingHistory();

  if (isLoading) {
    return (
      <PageWrapper>
        <BackLink />
        <div className="mt-4 flex flex-col gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-80" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </PageWrapper>
    );
  }

  if (error || !data) {
    return (
      <PageWrapper>
        <BackLink />
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          We couldn't find that exercise.
        </p>
      </PageWrapper>
    );
  }

  const steps = toSteps(data.instructions);
  const secondary = (data.muscleGroups ?? []).filter(
    (m) => m.toLowerCase() !== data.mainTargetMuscle?.toLowerCase(),
  );
  // newest record of each type; the API sorts by type, then newest first
  const bestRecords = Object.values(
    (records ?? []).reduce<Record<string, PersonalRecord>>((acc, r) => {
      acc[r.recordType] ??= r;
      return acc;
    }, {}),
  ).filter((r) => RECORD_LABELS[r.recordType]);
  const last = history.lastPerformance.get(data._id);

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6 max-w-6xl">
        <BackLink />

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight capitalize text-gray-900 dark:text-white">
              {data.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {data.mainTargetMuscle && (
                <MuscleTag muscle={data.mainTargetMuscle} />
              )}
              {data.category && (
                <span className="inline-flex items-center gap-1 text-xs capitalize text-gray-600 dark:text-gray-300">
                  <CategoryIcon category={data.category} size={13} />
                  {data.category}
                </span>
              )}
              <DifficultyMeter level={data.difficulty} />
              {data.isCompound && <CompoundBadge />}
            </div>
          </div>
          <Link
            to="/my-logs/new"
            search={{ exercise: data._id }}
            className="shrink-0"
          >
            <Button className="gap-1.5 w-full md:w-auto">
              <PlusIcon size={16} aria-hidden="true" />
              Add to a new workout
            </Button>
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          {/* Main column */}
          <div className="flex flex-col gap-6 min-w-0">
            {data.description && (
              <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
                {data.description}
              </p>
            )}

            <WidgetCard title="How to do it" icon={ListOrderedIcon}>
              {steps.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No instructions for this exercise yet.
                </p>
              ) : steps.length === 1 ? (
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {steps[0]}
                </p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="size-6 shrink-0 grid place-items-center rounded-full bg-orange-50 text-xs font-semibold text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </WidgetCard>

            {data.images && data.images.length > 0 && (
              <ExerciseImages name={data.name} images={data.images} />
            )}
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-0">
            <WidgetCard title="Your records" icon={MedalIcon}>
              {bestRecords.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Complete a set of this exercise to start setting records.
                </p>
              ) : (
                <dl className="flex flex-col divide-y divide-gray-100 dark:divide-zinc-800">
                  {bestRecords.map((r) => (
                    <div
                      key={r._id}
                      className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0"
                    >
                      <dt className="text-sm text-gray-500 dark:text-gray-400">
                        {RECORD_LABELS[r.recordType]}
                        <span className="block text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(r.achievedDate)}
                          {r.setDetails?.weight !== undefined &&
                            r.setDetails?.reps !== undefined &&
                            ` · ${r.setDetails.weight}×${r.setDetails.reps}`}
                        </span>
                      </dt>
                      <dd className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                        {formatNumber(r.value, { maximumFractionDigits: 1 })}
                        <span className="ml-1 text-xs font-medium text-gray-400">
                          {r.unit}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </WidgetCard>

            <WidgetCard title="Last session" icon={HistoryIcon}>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {last ? (
                  <LastPerformanceLine perf={last} />
                ) : (
                  "Not done in the last 2 weeks"
                )}
              </p>
            </WidgetCard>

            <WidgetCard title="Equipment & muscles" icon={WrenchIcon}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-1.5">
                  {(data.equipmentNeeded ?? []).length === 0 ? (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      No equipment needed
                    </span>
                  ) : (
                    data.equipmentNeeded.map((item) => (
                      <span
                        key={item}
                        className="rounded-md bg-gray-100 px-2 py-1 text-xs capitalize text-gray-700 dark:bg-zinc-800 dark:text-gray-300"
                      >
                        {item}
                      </span>
                    ))
                  )}
                </div>
                {secondary.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Also works
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {secondary.map((m) => (
                        <MuscleTag key={m} muscle={m} />
                      ))}
                    </div>
                  </div>
                )}
                {/* Body map: tablet and up only */}
                <BodyMap
                  className="hidden md:flex"
                  showLegend={false}
                  recent={new Map()}
                  worked={Object.fromEntries(
                    [data.mainTargetMuscle, ...secondary]
                      .filter(Boolean)
                      .map((m) => [m, 1]),
                  )}
                />
              </div>
            </WidgetCard>
          </aside>
        </div>
      </div>
    </PageWrapper>
  );
}

export default ExerciseView;
