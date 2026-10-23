import { PlusIcon, SparklesIcon } from "lucide-react";
import type { Exercise } from "../../api/exercises/use-list-exercises";
import type { Suggestion } from "../../utils/suggest-exercises";
import MuscleTag from "../muscle-tag";

type ExerciseSuggestionsProps = {
  suggestions: Suggestion<Exercise>[];
  onAdd: (exerciseId: string) => void;
};

const ExerciseSuggestions = ({
  suggestions,
  onAdd,
}: ExerciseSuggestionsProps) => {
  if (suggestions.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-1.5 text-sm font-medium">
        <SparklesIcon
          size={14}
          aria-hidden="true"
          className="text-orange-500"
        />
        Fill the gaps
      </h2>
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {suggestions.map(({ exercise, reason }) => (
          <li
            key={exercise._id}
            className="flex items-center gap-3 min-w-0 pl-3 pr-1.5 py-2 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700"
          >
            <div className="flex-1 min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium capitalize">
                <span className="truncate">{exercise.name}</span>
                <MuscleTag muscle={exercise.mainTargetMuscle} />
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {reason}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onAdd(exercise._id)}
              aria-label={`Add ${exercise.name}`}
              className="shrink-0 flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 transition-colors"
            >
              <PlusIcon size={14} aria-hidden="true" />
              Add
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ExerciseSuggestions;
