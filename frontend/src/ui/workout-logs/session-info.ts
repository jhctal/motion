import {
  CircleCheckIcon,
  CircleDashedIcon,
  CirclePlayIcon,
  CircleSlashIcon,
  ClockIcon,
  DumbbellIcon,
  LayersIcon,
  ListIcon,
  StarIcon,
} from "lucide-react";
import type { WorkoutSession } from "../../api/logged-workouts/use-list-logs";
import { formatCompact, formatDuration } from "../../utils/format-date";

// Shared by the list, grid and calendar views of the logs page

export const STATUS = {
  completed: {
    label: "Completed",
    icon: CircleCheckIcon,
    tile: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400",
    badge:
      "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/30",
    // left edge of the small calendar chips
    accent: "border-l-green-500",
    dot: "bg-green-500",
  },
  "in-progress": {
    label: "In progress",
    icon: CirclePlayIcon,
    tile: "bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400",
    badge:
      "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/30",
    accent: "border-l-orange-500",
    dot: "bg-orange-500",
  },
  planned: {
    label: "Planned",
    icon: CircleDashedIcon,
    tile: "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400",
    badge:
      "bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-zinc-800 dark:text-gray-300 dark:ring-zinc-600",
    accent: "border-l-gray-400",
    dot: "bg-gray-400",
  },
  skipped: {
    label: "Skipped",
    icon: CircleSlashIcon,
    tile: "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400",
    badge:
      "bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-zinc-800 dark:text-gray-300 dark:ring-zinc-600",
    accent: "border-l-gray-400",
    dot: "bg-gray-400",
  },
} as const;

export const statusOf = (status: string) =>
  STATUS[status as keyof typeof STATUS] ?? STATUS.planned;

// When the workout happened; older logs may not have startedAt
export const sessionDate = (session: WorkoutSession) =>
  new Date(session.startedAt ?? session.createdAt);

// e.g. 2026-10-24 in local time, for grouping by calendar day
export function toDayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function sessionMuscles(session: WorkoutSession) {
  return [
    ...new Set(
      session.exercises
        .map((ex) => ex.exercise?.mainTargetMuscle)
        .filter((m): m is string => !!m),
    ),
  ];
}

export function sessionStats(session: WorkoutSession) {
  const isCompleted = session.status === "completed";
  const allSets = session.exercises.flatMap((ex) => ex.sets ?? []);
  const doneSets = allSets.filter((set) => set.completed).length;

  return [
    isCompleted && session.duration > 0
      ? {
          label: "Duration",
          icon: ClockIcon,
          text: formatDuration(session.duration),
        }
      : null,
    allSets.length > 0
      ? {
          label: "Sets",
          icon: LayersIcon,
          text: isCompleted
            ? `${doneSets} sets`
            : `${doneSets}/${allSets.length} sets`,
        }
      : null,
    session.totalWeight > 0
      ? {
          label: "Volume",
          icon: DumbbellIcon,
          text: `${formatCompact(session.totalWeight)} kg`,
        }
      : null,
    session.exercises.length > 0
      ? {
          label: "Exercises",
          icon: ListIcon,
          text: `${session.exercises.length} ${session.exercises.length === 1 ? "exercise" : "exercises"}`,
        }
      : null,
    session.rating
      ? { label: "Rating", icon: StarIcon, text: `${session.rating}/5` }
      : null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}
