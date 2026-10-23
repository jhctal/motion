import {
  useEffect,
  useId,
  useRef,
  useState,
  type LiHTMLAttributes,
} from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  GripVerticalIcon,
  InfoIcon,
  MinusIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type { Exercise } from "../../api/exercises/use-list-exercises";
import type { LastPerformance } from "../../utils/training-history";
import { formatRelativeDay } from "../../utils/format-date";
import cn from "../../utils/cn";
import MuscleTag from "../muscle-tag";

const MIN_SETS = 1;
const MAX_SETS = 10;

type PlanExerciseCardProps = {
  index: number;
  total: number;
  name: string;
  mainTargetMuscle?: string;
  category?: string;
  // Full exercise record, for the details and the expanded info
  details?: Exercise;
  sets: number;
  onSetsChange: (sets: number) => void;
  lastPerformance?: LastPerformance;
  // Set when the muscle was trained inside the recovery window
  recoveringSince?: Date;
  dragging: boolean;
  dragProps: LiHTMLAttributes<HTMLLIElement>;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
};

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

const iconButton =
  "grid place-items-center rounded text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors";

function LastLine({ perf }: { perf?: LastPerformance }) {
  if (!perf) return <>No recent history</>;
  return (
    <>
      <span className="font-medium text-gray-700 dark:text-gray-200">Last</span>{" "}
      <span className="tabular-nums">{formatLastSets(perf)}</span> ·{" "}
      {formatRelativeDay(perf.date)}
    </>
  );
}

function SetStepper({
  name,
  sets,
  onSetsChange,
  compact,
}: {
  name: string;
  sets: number;
  onSetsChange: (sets: number) => void;
  // Phones: smaller buttons and no "sets" label
  compact?: boolean;
}) {
  const button = cn(
    iconButton,
    compact ? "size-7" : "size-8",
    "disabled:opacity-30",
  );
  return (
    <div
      className="flex items-center shrink-0 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
      role="group"
      aria-label={`Sets for ${name}`}
    >
      <button
        type="button"
        onClick={() => onSetsChange(sets - 1)}
        disabled={sets <= MIN_SETS}
        aria-label="Fewer sets"
        className={button}
      >
        <MinusIcon size={compact ? 12 : 14} />
      </button>
      <span
        className={cn(
          "text-center text-xs tabular-nums",
          compact ? "w-4" : "w-12",
        )}
        aria-live="polite"
      >
        <span className="font-semibold text-sm">{sets}</span>
        {compact ? (
          <span className="sr-only"> sets</span>
        ) : (
          ` ${sets === 1 ? "set" : "sets"}`
        )}
      </span>
      <button
        type="button"
        onClick={() => onSetsChange(sets + 1)}
        disabled={sets >= MAX_SETS}
        aria-label="More sets"
        className={button}
      >
        <PlusIcon size={compact ? 12 : 14} />
      </button>
    </div>
  );
}

// Equipment, secondary muscles and instructions
function ExerciseInfo({ details }: { details?: Exercise }) {
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

const PlanExerciseCard = ({
  index,
  total,
  name,
  mainTargetMuscle,
  category,
  details,
  sets,
  onSetsChange,
  lastPerformance,
  recoveringSince,
  dragging,
  dragProps,
  onMove,
  onRemove,
}: PlanExerciseCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const cardRef = useRef<HTMLLIElement>(null);
  const expandedId = useId();
  const popoverId = useId();
  const recoveryLabel =
    recoveringSince &&
    `${mainTargetMuscle} trained ${formatRelativeDay(recoveringSince)}`;

  // Phone info popover closes on outside tap or Escape
  useEffect(() => {
    if (!infoOpen) return;
    function handlePointer(e: PointerEvent) {
      if (!cardRef.current?.contains(e.target as Node)) setInfoOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setInfoOpen(false);
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [infoOpen]);

  return (
    <li
      ref={cardRef}
      {...dragProps}
      className={cn(
        // min-w-0 stops long names widening the grid past the screen
        "relative group flex flex-col min-w-0 rounded-lg border bg-gray-50 dark:bg-zinc-900 transition-colors",
        dragging
          ? "border-orange-500 opacity-60"
          : "border-gray-300 dark:border-zinc-700 md:hover:border-orange-400",
      )}
    >
      {/* Name and actions; everything on one line on phones */}
      <div className="flex items-center gap-1.5 md:gap-2 pl-2 pr-1 py-1.5 md:pb-0">
        <GripVerticalIcon
          aria-hidden="true"
          size={16}
          className="hidden md:block shrink-0 text-gray-300 dark:text-zinc-600 cursor-grab"
        />
        <span className="size-5 md:size-6 shrink-0 grid place-items-center rounded-full bg-gray-200 dark:bg-zinc-800 text-[10px] md:text-xs font-semibold text-gray-600 dark:text-gray-300">
          {index + 1}
        </span>
        <p className="flex-1 min-w-0 font-medium capitalize text-sm truncate">
          {name}
        </p>
        {recoveryLabel && (
          <span className="shrink-0 text-amber-500" title={recoveryLabel}>
            <TriangleAlertIcon size={15} aria-hidden="true" />
            <span className="sr-only">{recoveryLabel}</span>
          </span>
        )}

        {/* Phones only */}
        <button
          type="button"
          onClick={() => setInfoOpen((o) => !o)}
          aria-expanded={infoOpen}
          aria-controls={popoverId}
          aria-label={`About ${name}`}
          className={cn(
            iconButton,
            "md:hidden size-7 shrink-0",
            infoOpen && "text-orange-500",
          )}
        >
          <InfoIcon size={16} />
        </button>
        {mainTargetMuscle && (
          <MuscleTag
            muscle={mainTargetMuscle}
            className="md:hidden max-w-20 truncate"
          />
        )}
        <div className="md:hidden">
          <SetStepper
            name={name}
            sets={sets}
            onSetsChange={onSetsChange}
            compact
          />
        </div>

        {/* keyboard-friendly reordering; drag does the same on desktop */}
        <div className="hidden md:flex opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={`Move ${name} earlier`}
            className={cn(iconButton, "size-7 disabled:invisible")}
          >
            <ChevronUpIcon size={16} />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label={`Move ${name} later`}
            className={cn(iconButton, "size-7 disabled:invisible")}
          >
            <ChevronDownIcon size={16} />
          </button>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="size-7 md:size-8 shrink-0 grid place-items-center rounded text-lg leading-none text-gray-400 dark:text-gray-300 hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          ×
        </button>
      </div>

      {/* Phone info popover */}
      {infoOpen && (
        <div
          id={popoverId}
          role="dialog"
          aria-label={`About ${name}`}
          className="md:hidden absolute z-30 left-0 right-0 top-full mt-1 flex flex-col gap-3 max-h-72 overflow-y-auto p-3 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900 text-xs text-gray-600 dark:text-gray-300"
        >
          <p className="capitalize">
            {category}
            {details?.difficulty && ` · ${details.difficulty}`}
            {details?.isCompound && " · Compound"}
          </p>
          <p>
            <LastLine perf={lastPerformance} />
          </p>
          <ExerciseInfo details={details} />
        </div>
      )}

      {/* Tablet and up: details, last time and sets */}
      <div className="hidden md:flex flex-wrap items-center gap-x-2 gap-y-1 pl-13 pr-3 pt-1 text-xs text-gray-500 dark:text-gray-400 capitalize">
        {mainTargetMuscle && <MuscleTag muscle={mainTargetMuscle} />}
        {category && <span>{category}</span>}
        {details?.difficulty && (
          <>
            <span aria-hidden="true">·</span>
            <span>{details.difficulty}</span>
          </>
        )}
        {details?.isCompound && (
          <>
            <span aria-hidden="true">·</span>
            <span>Compound</span>
          </>
        )}
      </div>
      <div className="hidden md:flex items-center justify-between gap-3 pl-13 pr-2 py-2">
        <p className="min-w-0 text-xs text-gray-500 dark:text-gray-400 truncate">
          <LastLine perf={lastPerformance} />
        </p>
        <SetStepper name={name} sets={sets} onSetsChange={onSetsChange} />
      </div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls={expandedId}
        className="hidden md:flex items-center justify-center gap-1 py-1.5 border-t border-gray-200 dark:border-zinc-800 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {expanded ? "Hide details" : "How to & equipment"}
        <ChevronDownIcon
          size={14}
          aria-hidden="true"
          className={cn("transition-transform", expanded && "rotate-180")}
        />
      </button>
      {expanded && (
        <div
          id={expandedId}
          className="hidden md:flex flex-col gap-3 px-3 pb-3 text-xs text-gray-600 dark:text-gray-300"
        >
          <ExerciseInfo details={details} />
        </div>
      )}
    </li>
  );
};

export default PlanExerciseCard;
