import { useEffect, useRef, useState } from "react";
import type { Exercise } from "../api/exercises/use-list-exercises";

type Props = {
  exercises: Exercise[];
  onSelect: (exerciseId: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

const FilterableExerciseSelect = ({
  exercises,
  onSelect,
  disabled,
  placeholder = "+ Add exercise",
}: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [opensUpward, setOpensUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpensUpward(spaceBelow < 300);
      }
      inputRef.current?.focus();
    } else {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const lowerQuery = query.toLowerCase();
  const filtered = lowerQuery
    ? exercises.filter(
        (ex) =>
          ex.name.toLowerCase().includes(lowerQuery) ||
          ex.mainTargetMuscle?.toLowerCase().includes(lowerQuery),
      )
    : exercises;

  const grouped: Record<string, Exercise[]> = {};
  for (const ex of filtered) {
    const key = ex.mainTargetMuscle || "other";
    (grouped[key] ??= []).push(ex);
  }
  const sortedGroups = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  function handleSelect(id: string) {
    setOpen(false);
    onSelect(id);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full p-4 border border-dashed rounded bg-transparent text-sm text-gray-400 dark:text-gray-300 capitalize hover:border-orange-400 transition-colors disabled:opacity-40 text-left"
      >
        {placeholder}
      </button>

      {open && (
        <div
          className={`absolute z-50 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded shadow-lg ${opensUpward ? "bottom-full mb-1" : "top-full mt-1"}`}
        >
          <div className="p-2 border-b border-zinc-700">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises..."
              className="w-full bg-zinc-800 text-sm text-white placeholder-gray-500 rounded px-3 py-2 outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>

          <ul className="max-h-64 overflow-y-auto py-1">
            {sortedGroups.length === 0 && (
              <li className="px-4 py-2 text-sm text-gray-500">No results</li>
            )}
            {sortedGroups.map((muscle) => (
              <li key={muscle}>
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0 bg-zinc-900">
                  {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                </div>
                {grouped[muscle]
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((ex) => (
                    <button
                      key={ex._id}
                      type="button"
                      onClick={() => handleSelect(ex._id)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-200 capitalize hover:bg-zinc-700 hover:text-orange-400 transition-colors"
                    >
                      {ex.name}
                    </button>
                  ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FilterableExerciseSelect;
