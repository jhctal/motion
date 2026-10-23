import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react";
import cn from "../../utils/cn";
import { formatNumber, groupSeparator } from "../../utils/format-date";

// Shared frame for dashboard widgets: icon chip, title, optional controls,
// and a skeleton while loading

type WidgetCardProps = {
  title: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  // Right side of the header, e.g. a SegmentedControl
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function WidgetCard({
  title,
  icon: Icon,
  action,
  className,
  children,
}: WidgetCardProps) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "h-full flex flex-col gap-4 p-5 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 min-h-7">
        <h2
          id={titleId}
          className="flex items-center gap-2.5 text-sm font-medium text-gray-600 dark:text-gray-300"
        >
          <span className="size-7 grid place-items-center rounded-lg bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400">
            <Icon size={15} aria-hidden="true" />
          </span>
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

type SegmentedControlProps<T extends string> = {
  label: string;
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
};

// Small pill switcher for time periods. One highlight sits behind the
// buttons and slides to whichever is selected.
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const groupRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(
    null,
  );
  // no slide on first paint, only when the selection changes afterwards
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const measure = () => {
      const active = group.querySelector<HTMLElement>('[aria-checked="true"]');
      if (active) {
        setPill({ left: active.offsetLeft, width: active.offsetWidth });
      }
    };
    measure();
    // labels can change width when fonts load or the layout resizes
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    return () => observer.disconnect();
  }, [value]);

  useEffect(() => {
    if (pill && !animate) {
      const frame = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [pill, animate]);

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={label}
      className="relative flex shrink-0 rounded-lg bg-gray-100 p-0.5 dark:bg-zinc-800"
    >
      {pill && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-0.5 left-0 rounded-md bg-white shadow-sm dark:bg-zinc-700",
            animate &&
              "transition-[translate,width] duration-200 ease-out motion-reduce:transition-none",
          )}
          style={{ width: pill.width, translate: `${pill.left}px 0` }}
        />
      )}
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "relative px-2 py-0.5 rounded-md text-xs font-medium transition-colors duration-200",
            value === o.value
              ? "text-gray-900 dark:text-white"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Animates whole numbers up from 0 (see .count-up in index.css). Counters
// can't print separators, so big numbers count up as 3-digit groups with the
// locale's separator between them. Decimals are shown as plain text.
export function CountUp({ value }: { value: number }) {
  if (!Number.isInteger(value) || value < 0) {
    return <>{formatNumber(value)}</>;
  }

  // 12450 → [12, 450]
  const groups: number[] = [];
  let rest = value;
  do {
    groups.unshift(rest % 1000);
    rest = Math.floor(rest / 1000);
  } while (rest > 0);
  const separator = groupSeparator();

  return (
    // key restarts the animation whenever the value changes
    <span key={value}>
      <span aria-hidden="true">
        {groups.map((group, i) => (
          <Fragment key={i}>
            {i > 0 && separator}
            <span
              className={i === 0 ? "count-up" : "count-up count-up-pad"}
              style={{ "--to": group } as CSSProperties}
            />
          </Fragment>
        ))}
      </span>
      {/* generated content isn't read reliably, so screen readers get this */}
      <span className="sr-only">{formatNumber(value)}</span>
    </span>
  );
}

// Big number with an optional unit and a quieter detail line underneath.
// Numbers count up; pass a string to show it as-is.
export function StatValue({
  value,
  unit,
  detail,
}: {
  value: number | string;
  unit?: string;
  detail?: ReactNode;
}) {
  return (
    <div className="mt-auto">
      <p className="text-3xl font-semibold tracking-tight tabular-nums text-gray-900 dark:text-white">
        {typeof value === "number" ? <CountUp value={value} /> : value}
        {unit && (
          <span className="ml-1.5 text-base font-medium text-gray-400 dark:text-gray-500">
            {unit}
          </span>
        )}
      </p>
      {detail && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {detail}
        </p>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-gray-100 dark:bg-zinc-800",
        className,
      )}
    />
  );
}

export function StatSkeleton() {
  return (
    <div className="mt-auto flex flex-col gap-2" aria-label="Loading">
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}
