import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import cn from "../../utils/cn";

type ComboboxProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
  // Extra text to search beyond the label
  getSearchText?: (item: T) => string;
  // Group items under sticky headers; omit for a flat list
  getGroup?: (item: T) => string;
  // Shown on the right of each option, e.g. a category badge
  renderMeta?: (item: T) => ReactNode;
  // Key of the currently chosen item, for pickers that hold a value
  value?: string;
  // Lets the user clear the chosen value with the × button
  onClear?: () => void;
  disabled?: boolean;
  placeholder?: string;
  // Used in the result count and empty message, e.g. "exercise"
  noun?: string;
};

type Group<T> = { name: string; items: T[] };

const capitalise = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

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

function Combobox<T>({
  items,
  getKey,
  getLabel,
  onSelect,
  getSearchText,
  getGroup,
  renderMeta,
  value,
  onClear,
  disabled,
  placeholder = "Search…",
  noun = "item",
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [opensUpward, setOpensUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const selected = value
    ? items.find((item) => getKey(item) === value)
    : undefined;
  const selectedLabel = selected ? getLabel(selected) : undefined;

  const trimmed = query.trim().toLowerCase();
  const groups = useMemo<Group<T>[]>(() => {
    // Every search word must appear in the label or extra search text
    const words = trimmed.split(/\s+/).filter(Boolean);
    const filtered = items.filter((item) => {
      const haystack =
        `${getLabel(item)} ${getSearchText?.(item) ?? ""}`.toLowerCase();
      return words.every((w) => haystack.includes(w));
    });
    const byLabel = (a: T, b: T) => getLabel(a).localeCompare(getLabel(b));

    if (!getGroup) return [{ name: "", items: filtered.sort(byLabel) }];

    const grouped: Record<string, T[]> = {};
    for (const item of filtered) {
      (grouped[getGroup(item) || "other"] ??= []).push(item);
    }
    return Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ name, items: grouped[name].sort(byLabel) }));
    // callers pass inline functions, so only re-run when the data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, trimmed]);
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

  function select(item: T | undefined) {
    if (!item) return;
    close();
    onSelect(item);
  }

  // Start on the chosen item if there is one, otherwise the first result
  useEffect(() => {
    const selectedIndex =
      !trimmed && value ? flat.findIndex((item) => getKey(item) === value) : -1;
    setActiveIndex(Math.max(selectedIndex, 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed, open]);

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

  // × clears the search first, then the chosen value
  const clearAction = query
    ? () => setQuery("")
    : selected && onClear
      ? () => {
          close();
          onClear();
        }
      : null;

  let flatIndex = -1;

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex items-center gap-2 px-3 rounded-lg border bg-gray-50 dark:bg-zinc-900 transition-colors",
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
          // show the chosen item while closed; search over it while open
          value={open ? query : (selectedLabel ?? "")}
          disabled={disabled}
          placeholder={open && selectedLabel ? selectedLabel : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            openList();
          }}
          onFocus={openList}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          // 16px on mobile stops iOS zooming into the field
          className="flex-1 min-w-0 py-3 bg-transparent outline-none text-base sm:text-sm capitalize placeholder:normal-case placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        {clearAction ? (
          <button
            type="button"
            aria-label={query ? "Clear search" : "Clear selection"}
            onClick={(e) => {
              e.stopPropagation();
              clearAction();
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
            <path
              d="m5 8 5 5 5-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
            id={`${id}-listbox`}
            role="listbox"
            aria-label={`${capitalise(noun)}s`}
            className="max-h-72 overflow-y-auto overscroll-contain"
          >
            {flat.length === 0 && (
              <li className="px-4 py-6 text-sm text-center text-gray-500">
                {trimmed
                  ? `No ${noun}s match “${query.trim()}”`
                  : `No ${noun}s yet`}
              </li>
            )}
            {groups.map((group) => (
              <li key={group.name} role="presentation">
                {getGroup && (
                  <div
                    id={`${id}-group-${group.name}`}
                    className="sticky top-0 z-10 flex justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700"
                  >
                    {capitalise(group.name)}
                    <span className="font-normal">{group.items.length}</span>
                  </div>
                )}
                <ul
                  role="group"
                  aria-labelledby={
                    getGroup ? `${id}-group-${group.name}` : undefined
                  }
                >
                  {group.items.map((item) => {
                    flatIndex++;
                    const index = flatIndex;
                    const active = index === activeIndex;
                    const isSelected =
                      value !== undefined && getKey(item) === value;
                    return (
                      <li
                        key={getKey(item)}
                        id={optionId(index)}
                        role="option"
                        aria-selected={active}
                        // keep focus in the input so typing continues to work
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseMove={() => !active && setActiveIndex(index)}
                        onClick={() => select(item)}
                        className={cn(
                          "flex items-center justify-between gap-3 px-4 py-3 sm:py-2 text-sm cursor-pointer capitalize",
                          active
                            ? "bg-orange-50 text-gray-900 dark:bg-zinc-800 dark:text-white"
                            : "text-gray-700 dark:text-gray-200",
                          isSelected && "font-semibold",
                        )}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          {value !== undefined && (
                            <span
                              aria-hidden="true"
                              className="w-3 shrink-0 text-orange-500"
                            >
                              {isSelected ? "✓" : ""}
                            </span>
                          )}
                          <span className="truncate">
                            <Highlight text={getLabel(item)} query={trimmed} />
                          </span>
                        </span>
                        {renderMeta?.(item)}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
          <div className="hidden sm:flex justify-between px-3 py-1.5 text-xs text-gray-400 border-t border-gray-200 dark:border-zinc-700">
            <span>
              {flat.length} {noun}
              {flat.length === 1 ? "" : "s"}
            </span>
            <span>↑↓ navigate · ↵ select · esc close</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ComboboxBadge({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 text-xs font-normal px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-zinc-700 dark:text-gray-300">
      {children}
    </span>
  );
}

export default Combobox;
