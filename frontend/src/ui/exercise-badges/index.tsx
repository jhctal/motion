import {
  DumbbellIcon,
  HeartPulseIcon,
  LayersIcon,
  ScaleIcon,
  StretchHorizontalIcon,
  TrophyIcon,
} from "lucide-react";
import cn from "../../utils/cn";

const DIFFICULTY_LEVEL: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

// Three rising bars, filled up to the level, plus the word
export function DifficultyMeter({
  level,
  className,
}: {
  level?: string;
  className?: string;
}) {
  if (!level) return null;
  const filled = DIFFICULTY_LEVEL[level] ?? 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400",
        className,
      )}
    >
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={cn(
              "w-1 rounded-sm",
              bar === 1 ? "h-1.5" : bar === 2 ? "h-2.5" : "h-3.5",
              bar <= filled ? "bg-orange-500" : "bg-gray-200 dark:bg-zinc-700",
            )}
          />
        ))}
      </span>
      <span className="capitalize">{level}</span>
    </span>
  );
}

const CATEGORY_ICON = {
  strength: DumbbellIcon,
  cardio: HeartPulseIcon,
  flexibility: StretchHorizontalIcon,
  balance: ScaleIcon,
  sports: TrophyIcon,
} as const;

export function CategoryIcon({
  category,
  size = 16,
  className,
}: {
  category?: string;
  size?: number;
  className?: string;
}) {
  const Icon =
    CATEGORY_ICON[category as keyof typeof CATEGORY_ICON] ?? LayersIcon;
  return <Icon size={size} aria-hidden="true" className={className} />;
}

export function CompoundBadge() {
  return (
    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-300">
      Compound
    </span>
  );
}
