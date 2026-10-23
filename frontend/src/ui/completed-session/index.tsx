import { CheckIcon, MinusIcon } from "lucide-react";
import type {
  PopulatedExercise,
  WorkoutSession,
} from "../../api/workout-types";
import { formatDuration, formatNumber } from "../../utils/format-date";
import cn from "../../utils/cn";
import MuscleTag from "../muscle-tag";

type Props = { session: WorkoutSession };

const exerciseOf = (ex: WorkoutSession["exercises"][number]) =>
  typeof ex.exercise === "object"
    ? ex.exercise
    : ({ name: "Unknown exercise" } as Partial<PopulatedExercise>);

function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

type SessionSet = NonNullable<
  WorkoutSession["exercises"][number]["sets"]
>[number];

// Totals from completed sets only, matching how the server counts them
function totalsOf(allSets: SessionSet[]) {
  let sets = 0;
  let reps = 0;
  let volume = 0;
  let seconds = 0;
  for (const set of allSets) {
    if (!set.completed) continue;
    sets++;
    reps += set.reps || 0;
    volume += (set.weight || 0) * (set.reps || 0);
    seconds += set.durationInSeconds || 0;
  }
  return { sets, reps, volume, seconds };
}

const totals = (session: WorkoutSession) =>
  totalsOf(session.exercises.flatMap((ex) => ex.sets ?? []));

// Short form of one set, e.g. "80×8", "45s", "12 reps"
function formatSet(set: SessionSet) {
  if (set.weight > 0) return `${set.weight}×${set.reps}`;
  if ((set.durationInSeconds ?? 0) > 0 && !set.reps) {
    return formatSeconds(set.durationInSeconds!);
  }
  return `${set.reps} reps`;
}

const label =
  "text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400";

// Headline numbers for a finished workout; works at every screen size
export function CompletedSummary({ session }: Props) {
  const t = totals(session);
  const stats = [
    {
      name: "Duration",
      value: session.duration ? formatDuration(session.duration) : "—",
    },
    { name: "Sets", value: formatNumber(t.sets) },
    { name: "Reps", value: formatNumber(t.reps) },
    { name: "Volume", value: formatNumber(t.volume) },
    { name: "Rating", value: session.rating ? `${session.rating}/5` : "—" },
    { name: "Feeling", value: session.feeling ?? "—" },
  ];

  return (
    <div className="flex flex-col gap-3 mb-6">
      <dl className="grid grid-cols-3 md:grid-cols-6 rounded-lg border border-gray-300 dark:border-zinc-700 divide-gray-300 dark:divide-zinc-700 overflow-hidden">
        {stats.map((stat, i) => (
          <div
            key={stat.name}
            className={cn(
              "px-3 py-2 bg-gray-50 dark:bg-zinc-900",
              // dividers between cells: 3 per row on phones, 6 on wider screens
              i % 3 !== 0 && "border-l border-gray-300 dark:border-zinc-700",
              i >= 3 &&
                "border-t md:border-t-0 border-gray-300 dark:border-zinc-700",
              i === 3 && "md:border-l",
            )}
          >
            <dt className={label}>{stat.name}</dt>
            <dd className="text-base font-semibold tabular-nums capitalize">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
      {session.notes && (
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
          <span className="font-medium text-gray-900 dark:text-white">
            Notes:{" "}
          </span>
          {session.notes}
        </p>
      )}
    </div>
  );
}

// Set-by-set table for a finished workout, for tablet and up
export function CompletedSessionTable({ session }: Props) {
  const t = totals(session);
  const hasTime = session.exercises.some((ex) =>
    (ex.sets ?? []).some((set) => (set.durationInSeconds ?? 0) > 0),
  );
  const cell = "px-3 py-2";
  const num = cn(cell, "text-right tabular-nums");

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-zinc-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-zinc-900 text-left">
          <tr className={label}>
            <th scope="col" className={cn(cell, "font-medium")}>
              Exercise
            </th>
            <th scope="col" className={cn(cell, "font-medium w-14")}>
              Set
            </th>
            <th scope="col" className={cn(num, "font-medium")}>
              Weight
            </th>
            <th scope="col" className={cn(num, "font-medium")}>
              Reps
            </th>
            {hasTime && (
              <th scope="col" className={cn(num, "font-medium")}>
                Time
              </th>
            )}
            <th scope="col" className={cn(num, "font-medium")}>
              Volume
            </th>
            <th
              scope="col"
              className={cn(cell, "font-medium w-16 text-center")}
            >
              Done
            </th>
          </tr>
        </thead>

        {session.exercises.map((ex, exIndex) => {
          const info = exerciseOf(ex);
          const sets = ex.sets ?? [];
          const done = sets.filter((s) => s.completed);
          const best = done.reduce<(typeof sets)[number] | undefined>(
            (top, s) =>
              !top ||
              (s.weight || 0) * (s.reps || 0) >
                (top.weight || 0) * (top.reps || 0)
                ? s
                : top,
            undefined,
          );
          const heading = (
            <th
              scope="rowgroup"
              rowSpan={Math.max(sets.length, 1)}
              className={cn(cell, "align-top text-left font-normal w-[38%]")}
            >
              <div className="flex flex-col items-start gap-1">
                <span className="font-medium capitalize">{info.name}</span>
                {info.mainTargetMuscle && (
                  <MuscleTag muscle={info.mainTargetMuscle} />
                )}
                {best && best.weight > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                    Best {best.weight}×{best.reps}
                  </span>
                )}
              </div>
            </th>
          );

          return (
            <tbody
              key={`${info._id ?? "ex"}-${exIndex}`}
              className="border-t border-gray-300 dark:border-zinc-700"
            >
              {sets.length === 0 ? (
                <tr>
                  {heading}
                  <td
                    colSpan={hasTime ? 6 : 5}
                    className={cn(cell, "text-gray-400 italic")}
                  >
                    No sets logged
                  </td>
                </tr>
              ) : (
                sets.map((set, i) => (
                  <tr
                    key={set.setNumber}
                    className={cn(
                      i > 0 && "border-t border-gray-100 dark:border-zinc-800",
                      !set.completed && "text-gray-400 dark:text-gray-500",
                    )}
                  >
                    {i === 0 && heading}
                    <td className={cn(cell, "tabular-nums")}>
                      {set.setNumber}
                    </td>
                    <td className={num}>{set.weight ? set.weight : "—"}</td>
                    <td className={num}>{set.reps || "—"}</td>
                    {hasTime && (
                      <td className={num}>
                        {set.durationInSeconds
                          ? formatSeconds(set.durationInSeconds)
                          : "—"}
                      </td>
                    )}
                    <td className={num}>
                      {set.weight && set.reps
                        ? formatNumber(set.weight * set.reps)
                        : "—"}
                    </td>
                    <td className={cn(cell, "text-center")}>
                      {set.completed ? (
                        <CheckIcon
                          size={16}
                          className="inline text-green-600 dark:text-green-400"
                          aria-label="Completed"
                        />
                      ) : (
                        <MinusIcon
                          size={16}
                          className="inline"
                          aria-label="Not completed"
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          );
        })}

        <tfoot className="border-t-2 border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-900 font-semibold">
          <tr>
            <th scope="row" className={cn(cell, "text-left")}>
              Total
            </th>
            <td className={cn(cell, "tabular-nums")}>{t.sets}</td>
            <td className={num} />
            <td className={num}>{formatNumber(t.reps)}</td>
            {hasTime && <td className={num}>{formatSeconds(t.seconds)}</td>}
            <td className={num}>{formatNumber(t.volume)}</td>
            <td className={cell} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// One compact card per exercise for phones: totals plus a chip per set
export function CompletedExerciseList({ session }: Props) {
  return (
    <ol className="flex flex-col divide-y divide-gray-200 dark:divide-zinc-800 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
      {session.exercises.map((ex, exIndex) => {
        const info = exerciseOf(ex);
        const sets = ex.sets ?? [];
        const t = totalsOf(sets);
        const summary = [
          `${t.sets} set${t.sets === 1 ? "" : "s"}`,
          t.reps > 0 && `${formatNumber(t.reps)} reps`,
          t.seconds > 0 && formatSeconds(t.seconds),
          t.volume > 0 && `${formatNumber(t.volume)} vol`,
        ].filter(Boolean);

        return (
          <li
            key={`${info._id ?? "ex"}-${exIndex}`}
            className="flex flex-col gap-2 px-3 py-2.5 min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-5 shrink-0 grid place-items-center rounded-full bg-gray-200 dark:bg-zinc-800 text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                {exIndex + 1}
              </span>
              <span className="flex-1 min-w-0 truncate text-sm font-medium capitalize">
                {info.name}
              </span>
              {info.mainTargetMuscle && (
                <MuscleTag
                  muscle={info.mainTargetMuscle}
                  className="max-w-24 truncate"
                />
              )}
            </div>
            <p className="pl-7 -mt-1 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
              {summary.join(" · ")}
            </p>
            {sets.length > 0 ? (
              <ul className="pl-7 flex flex-wrap gap-1.5" aria-label="Sets">
                {sets.map((set) => (
                  <li
                    key={set.setNumber}
                    className={cn(
                      "px-2 py-0.5 rounded-md border text-xs tabular-nums",
                      set.completed
                        ? "border-gray-300 bg-white text-gray-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        : "border-dashed border-gray-300 text-gray-400 line-through dark:border-zinc-700 dark:text-gray-500",
                    )}
                  >
                    {formatSet(set)}
                    {!set.completed && (
                      <span className="sr-only"> (skipped)</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pl-7 text-xs italic text-gray-400">
                No sets logged
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
