import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Exercise } from "../api/exercises/use-list-exercises";
import cn from "../utils/cn";

type Props = {
  exercises: Exercise[];
  onSelect: (exerciseId: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

type Group = { muscle: string; items: Exercise[] };

const capitalise = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// Every search word must appear in the name, target muscle or category
function matches(ex: Exercise, words: string[]) {
  const haystack =
    `${ex.name} ${ex.mainTargetMuscle ?? ""} ${ex.category ?? ""}`.toLowerCase();
  return words.every((w) => haystack.includes(w));
}

function groupByMuscle(exercises: Exercise[]): Group[] {
  const grouped: Record<string, Exercise[]> = {};
  for (const ex of exercises) {
    (grouped[ex.mainTargetMuscle || "other"] ??= []).push(ex);
  }
  return Object.keys(grouped)
    .sort((a, b) => a.localeCompare(b))
    .map((muscle) => ({
      muscle,
      items: grouped[muscle].sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

function Highlight({ text, query }: { text: string; query: string }) {
  const index = query ? text.toLowerCase().indexOf(query) : -1;
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <span className="text-orange-500 font-semibold">
        {text.slice(index, index + query.length)}
      </span>
      {text.slice(index + query.length)}
    </>
  );
}

const FilterableExerciseSelect = ({
  exercises,
  onSelect,
  disabled,
  placeholder = "+ Add exercise",
}: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [opensUpward, setOpensUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();

  const trimmed = query.trim().toLowerCase();
  const groups = useMemo(() => {
    const words = trimmed.split(/\s+/).filter(Boolean);
    return groupByMuscle(exercises.filter((ex) => matches(ex, words)));
  }, [exercises, trimmed]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const optionId = (index: number) => `${id}-option-${index}`;

  function openList() {
    if (disabled || open) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setOpensUpward(window.innerHeight - rect.bottom < 320);
    }
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setQuery("");
  }

  function select(exercise: Exercise | undefined) {
    if (!exercise) return;
    close();
    onSelect(exercise._id);
  }

  // Reset the highlight whenever the results change
  useEffect(() => setActiveIndex(0), [trimmed, open]);

  // Keep the highlighted option in view while using the keyboard
  useEffect(() => {
    if (!open) return;
    document
      .getElementById(optionId(activeIndex))
      ?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) return openList();
        setActiveIndex((i) => (flat.length ? (i + 1) % flat.length : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) return openList();
        setActiveIndex((i) =>
          flat.length ? (i - 1 + flat.length) % flat.length : 0,
        );
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActiveIndex(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActiveIndex(Math.max(flat.length - 1, 0));
        }
        break;
      case "Enter":
        if (open) {
          e.preventDefault();
          select(flat[activeIndex]);
        }
        break;
      case "Escape":
        if (open || query) {
          e.preventDefault();
          close();
        }
        break;
      case "Tab":
        close();
        break;
    }
  }

  let flatIndex = -1;

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex items-center gap-2 px-3 rounded-lg border bg-white dark:bg-zinc-900 transition-colors",
          open
            ? "border-orange-500 ring-2 ring-orange-500/20"
            : "border-gray-300 dark:border-zinc-700 hover:border-orange-400",
          disabled && "opacity-50 pointer-events-none",
        )}
        onClick={() => {
          inputRef.current?.focus();
          openList();
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-4 shrink-0 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="m14 14 4 4" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          aria-activedescendant={
            open && flat.length ? optionId(activeIndex) : undefined
          }
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            openList();
          }}
          onFocus={openList}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          // 16px on mobile stops iOS zooming into the field
          className="flex-1 min-w-0 py-3 bg-transparent outline-none text-base sm:text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={(e) => {
              e.stopPropagation();
              setQuery("");
              inputRef.current?.focus();
            }}
            className="size-6 grid place-items-center rounded text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            ×
          </button>
        ) : (
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className={cn(
              "size-4 shrink-0 text-gray-400 transition-transform",
              open && "rotate-180",
            )}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {open && (
        <div
          className={cn(
            "absolute z-50 left-0 right-0 overflow-hidden rounded-lg border shadow-xl",
            "bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-700",
            opensUpward ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          <ul
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            aria-label="Exercises"
            className="max-h-72 overflow-y-auto overscroll-contain"
          >
            {flat.length === 0 && (
              <li className="px-4 py-6 text-sm text-center text-gray-500">
                No exercises match “{query.trim()}”
              </li>
            )}
            {groups.map((group) => (
              <li key={group.muscle} role="presentation">
                <div
                  id={`${id}-group-${group.muscle}`}
                  className="sticky top-0 z-10 flex justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700"
                >
                  {capitalise(group.muscle)}
                  <span className="font-normal">{group.items.length}</span>
                </div>
                <ul role="group" aria-labelledby={`${id}-group-${group.muscle}`}>
                  {group.items.map((ex) => {
                    flatIndex++;
                    const index = flatIndex;
                    const active = index === activeIndex;
                    return (
                      <li
                        key={ex._id}
                        id={optionId(index)}
                        role="option"
                        aria-selected={active}
                        // keep focus in the input so typing continues to work
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseMove={() => !active && setActiveIndex(index)}
                        onClick={() => select(ex)}
                        className={cn(
                          "flex items-center justify-between gap-3 px-4 py-3 sm:py-2 text-sm cursor-pointer capitalize",
                          active
                            ? "bg-orange-50 text-gray-900 dark:bg-zinc-800 dark:text-white"
                            : "text-gray-700 dark:text-gray-200",
                        )}
                      >
                        <span className="truncate">
                          <Highlight text={ex.name} query={trimmed} />
                        </span>
                        {ex.category && (
                          <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-zinc-700 dark:text-gray-300">
                            {ex.category}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
          <div className="hidden sm:flex justify-between px-3 py-1.5 text-xs text-gray-400 border-t border-gray-200 dark:border-zinc-700">
            <span>
              {flat.length} exercise{flat.length === 1 ? "" : "s"}
            </span>
            <span>↑↓ navigate · ↵ select · esc close</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterableExerciseSelect;
