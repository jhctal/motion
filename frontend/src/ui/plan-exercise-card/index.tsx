import {
  useCallback,
  useId,
  useRef,
  useState,
  type LiHTMLAttributes,
} from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  GripVerticalIcon,
  MinusIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type { Exercise } from "../../api/exercises/use-list-exercises";
import type { LastPerformance } from "../../utils/training-history";
import { formatRelativeDay } from "../../utils/format-date";
import cn from "../../utils/cn";
import useDismiss from "../../hooks/use-dismiss";
import MuscleTag from "../muscle-tag";
import {
  ExerciseInfoPopover,
  ExerciseInfoToggle,
  ExerciseMeta,
  InfoButton,
  LastPerformanceLine,
} from "../exercise-info";

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

const iconButton =
  "grid place-items-center rounded text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors";

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
  const closeInfo = useCallback(() => setInfoOpen(false), []);
  useDismiss(cardRef, infoOpen, closeInfo);

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
        <InfoButton
          name={name}
          open={infoOpen}
          onToggle={() => setInfoOpen((o) => !o)}
          controls={popoverId}
        />
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
        <ExerciseInfoPopover
          id={popoverId}
          name={name}
          category={category}
          details={details}
          lastPerformance={lastPerformance}
        />
      )}

      {/* Tablet and up: details, last time and sets */}
      <div className="hidden md:flex flex-wrap items-center gap-x-2 gap-y-1 pl-13 pr-3 pt-1 text-xs text-gray-500 dark:text-gray-400 capitalize">
        {mainTargetMuscle && <MuscleTag muscle={mainTargetMuscle} />}
        <span>
          <ExerciseMeta category={category} details={details} />
        </span>
      </div>
      <div className="hidden md:flex items-center justify-between gap-3 pl-13 pr-2 py-2">
        <p className="min-w-0 text-xs text-gray-500 dark:text-gray-400 truncate">
          <LastPerformanceLine perf={lastPerformance} />
        </p>
        <SetStepper name={name} sets={sets} onSetsChange={onSetsChange} />
      </div>
      <ExerciseInfoToggle
        id={expandedId}
        expanded={expanded}
        onToggle={() => setExpanded((e) => !e)}
        details={details}
      />
    </li>
  );
};

export default PlanExerciseCard;
