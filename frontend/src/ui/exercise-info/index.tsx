import { ChevronDownIcon, InfoIcon } from "lucide-react";
import type { Exercise } from "../../api/exercises/use-list-exercises";
import type { LastPerformance } from "../../utils/training-history";
import { formatRelativeDay } from "../../utils/format-date";
import cn from "../../utils/cn";
import Collapse from "../collapse";

// Shared pieces for exercise cards: "Last" figures, how-to details, and the
// phone popover / desktop toggle that reveal them

const iconButton =
  "grid place-items-center rounded text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors";

function formatLastSets(perf: LastPerformance) {
  return perf.sets
    .map((s) =>
      s.durationInSeconds > 0 && !s.reps
        ? `${s.durationInSeconds}s`
        : s.weight > 0
          ? `${s.weight}×${s.reps}`
          : `${s.reps} reps`,
    )
    .join(" · ");
}

export function LastPerformanceLine({ perf }: { perf?: LastPerformance }) {
  if (!perf) return <>No recent history</>;
  return (
    <>
      <span className="font-medium text-gray-700 dark:text-gray-200">Last</span>{" "}
      <span className="tabular-nums">{formatLastSets(perf)}</span> ·{" "}
      {formatRelativeDay(perf.date)}
    </>
  );
}

// Category · difficulty · compound
export function ExerciseMeta({
  category,
  details,
}: {
  category?: string;
  details?: Exercise;
}) {
  const parts = [
    category,
    details?.difficulty,
    details?.isCompound && "Compound",
  ].filter(Boolean);
  return <>{parts.join(" · ")}</>;
}

// Equipment, secondary muscles and instructions
export function ExerciseInfo({ details }: { details?: Exercise }) {
  return (
    <>
      {details?.equipmentNeeded && details.equipmentNeeded.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 font-medium text-gray-700 dark:text-gray-200">
            Equipment
          </span>
          {details.equipmentNeeded.map((item) => (
            <span
              key={item}
              className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-zinc-800 capitalize"
            >
              {item}
            </span>
          ))}
        </div>
      )}
      {details?.muscleGroups && details.muscleGroups.length > 0 && (
        <p className="capitalize">
          <span className="font-medium text-gray-700 dark:text-gray-200 normal-case">
            Also works{" "}
          </span>
          {details.muscleGroups.join(", ")}
        </p>
      )}
      {details?.description && <p>{details.description}</p>}
      <p className="whitespace-pre-line leading-relaxed">
        {details?.instructions || "No instructions for this exercise yet."}
      </p>
    </>
  );
}

// Phones: "i" button that opens ExerciseInfoPopover
export function InfoButton({
  name,
  open,
  onToggle,
  controls,
}: {
  name: string;
  open: boolean;
  onToggle: () => void;
  controls: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controls}
      aria-label={`About ${name}`}
      className={cn(
        iconButton,
        "md:hidden size-7 shrink-0",
        open && "text-orange-500",
      )}
    >
      <InfoIcon size={16} />
    </button>
  );
}

// Phones: panel below the card; the card must be `relative`
export function ExerciseInfoPopover({
  id,
  name,
  category,
  details,
  lastPerformance,
}: {
  id: string;
  name: string;
  category?: string;
  details?: Exercise;
  lastPerformance?: LastPerformance;
}) {
  return (
    <div
      id={id}
      role="dialog"
      aria-label={`About ${name}`}
      className="md:hidden absolute z-30 left-0 right-0 top-full mt-1 flex flex-col gap-3 max-h-72 overflow-y-auto p-3 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900 text-xs text-gray-600 dark:text-gray-300"
    >
      <p className="capitalize">
        <ExerciseMeta category={category} details={details} />
      </p>
      <p>
        <LastPerformanceLine perf={lastPerformance} />
      </p>
      <ExerciseInfo details={details} />
    </div>
  );
}

// Tablet and up: footer toggle plus the expanded details
export function ExerciseInfoToggle({
  id,
  expanded,
  onToggle,
  details,
}: {
  id: string;
  expanded: boolean;
  onToggle: () => void;
  details?: Exercise;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={id}
        className="hidden md:flex items-center justify-center gap-1 py-1.5 border-t border-gray-200 dark:border-zinc-800 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {expanded ? "Hide details" : "How to & equipment"}
        <ChevronDownIcon
          size={14}
          aria-hidden="true"
          className={cn(
            "transition-transform duration-150",
            expanded && "rotate-180",
          )}
        />
      </button>
      <div className="hidden md:block">
        <Collapse
          open={expanded}
          id={id}
          className="flex flex-col gap-3 px-3 pb-3 text-xs text-gray-600 dark:text-gray-300"
        >
          <ExerciseInfo details={details} />
        </Collapse>
      </div>
    </>
  );
}
