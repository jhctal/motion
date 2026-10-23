import type { ReactNode } from "react";
import cn from "../../utils/cn";
import { formatRelativeDay } from "../../utils/format-date";
import { RECOVERY_HOURS } from "../../utils/training-history";
import { muscleFillClass } from "../muscle-tag/colours";

type Region = { muscle: string; shape: ReactNode };

// Mirror a shape across the body's centre line (x = 60)
const pair = (left: ReactNode, right: ReactNode) => (
  <>
    {left}
    {right}
  </>
);

// Simplified figures on a 120 × 260 canvas
const FRONT: Region[] = [
  {
    muscle: "traps",
    shape: pair(
      <ellipse cx="51" cy="40" rx="6" ry="3" />,
      <ellipse cx="69" cy="40" rx="6" ry="3" />,
    ),
  },
  {
    muscle: "shoulders",
    shape: pair(
      <circle cx="36" cy="49" r="8.5" />,
      <circle cx="84" cy="49" r="8.5" />,
    ),
  },
  {
    muscle: "chest",
    shape: pair(
      <ellipse cx="50" cy="59" rx="10.5" ry="8.5" />,
      <ellipse cx="70" cy="59" rx="10.5" ry="8.5" />,
    ),
  },
  {
    muscle: "biceps",
    shape: pair(
      <ellipse cx="25" cy="69" rx="5.5" ry="13" />,
      <ellipse cx="95" cy="69" rx="5.5" ry="13" />,
    ),
  },
  {
    muscle: "forearms",
    shape: pair(
      <ellipse cx="20.5" cy="112" rx="5" ry="16" />,
      <ellipse cx="99.5" cy="112" rx="5" ry="16" />,
    ),
  },
  {
    muscle: "abs",
    shape: <rect x="52.5" y="70" width="15" height="40" rx="5" />,
  },
  {
    muscle: "obliques",
    shape: pair(
      <ellipse cx="44" cy="92" rx="5" ry="13" />,
      <ellipse cx="76" cy="92" rx="5" ry="13" />,
    ),
  },
  {
    muscle: "hip flexors",
    shape: pair(
      <ellipse cx="49" cy="124" rx="5" ry="5.5" />,
      <ellipse cx="71" cy="124" rx="5" ry="5.5" />,
    ),
  },
  {
    muscle: "quads",
    shape: pair(
      <ellipse cx="46" cy="160" rx="8.5" ry="24" />,
      <ellipse cx="74" cy="160" rx="8.5" ry="24" />,
    ),
  },
  {
    muscle: "adductors",
    shape: pair(
      <ellipse cx="56.5" cy="146" rx="3" ry="11" />,
      <ellipse cx="63.5" cy="146" rx="3" ry="11" />,
    ),
  },
  {
    muscle: "tibialis anterior",
    shape: pair(
      <ellipse cx="45" cy="216" rx="4.5" ry="17" />,
      <ellipse cx="75" cy="216" rx="4.5" ry="17" />,
    ),
  },
];

const BACK: Region[] = [
  { muscle: "traps", shape: <path d="M60 34 L75 45 L60 72 L45 45 Z" /> },
  {
    muscle: "rear deltoids",
    shape: pair(
      <circle cx="36" cy="49" r="8.5" />,
      <circle cx="84" cy="49" r="8.5" />,
    ),
  },
  {
    muscle: "rotator cuff",
    shape: pair(
      <ellipse cx="47" cy="56" rx="5.5" ry="4.5" />,
      <ellipse cx="73" cy="56" rx="5.5" ry="4.5" />,
    ),
  },
  {
    muscle: "back",
    shape: pair(
      <ellipse cx="46" cy="78" rx="8.5" ry="15" />,
      <ellipse cx="74" cy="78" rx="8.5" ry="15" />,
    ),
  },
  {
    muscle: "lower back",
    shape: <rect x="52.5" y="94" width="15" height="24" rx="5" />,
  },
  {
    muscle: "triceps",
    shape: pair(
      <ellipse cx="25" cy="69" rx="5.5" ry="13" />,
      <ellipse cx="95" cy="69" rx="5.5" ry="13" />,
    ),
  },
  {
    muscle: "forearms",
    shape: pair(
      <ellipse cx="20.5" cy="112" rx="5" ry="16" />,
      <ellipse cx="99.5" cy="112" rx="5" ry="16" />,
    ),
  },
  {
    muscle: "abductors",
    shape: pair(
      <ellipse cx="38.5" cy="132" rx="3.5" ry="8" />,
      <ellipse cx="81.5" cy="132" rx="3.5" ry="8" />,
    ),
  },
  {
    muscle: "glutes",
    shape: pair(
      <ellipse cx="50" cy="134" rx="9.5" ry="10" />,
      <ellipse cx="70" cy="134" rx="9.5" ry="10" />,
    ),
  },
  {
    muscle: "hamstrings",
    shape: pair(
      <ellipse cx="47" cy="168" rx="8" ry="20" />,
      <ellipse cx="73" cy="168" rx="8" ry="20" />,
    ),
  },
  {
    muscle: "calves",
    shape: pair(
      <ellipse cx="46" cy="212" rx="6" ry="16" />,
      <ellipse cx="74" cy="212" rx="6" ry="16" />,
    ),
  },
];

// "core" isn't its own region; light up the muscles it's made of
const ALIASES: Record<string, string[]> = { core: ["abs", "obliques"] };

function Silhouette() {
  return (
    <g className="fill-gray-200 dark:fill-zinc-800">
      <circle cx="60" cy="18" r="12" />
      <rect x="54" y="28" width="12" height="10" rx="3" />
      <rect x="33" y="37" width="54" height="94" rx="14" />
      <rect x="18" y="44" width="14" height="50" rx="7" />
      <rect x="88" y="44" width="14" height="50" rx="7" />
      <rect x="14.5" y="92" width="12" height="46" rx="6" />
      <rect x="93.5" y="92" width="12" height="46" rx="6" />
      <rect x="36" y="124" width="22" height="70" rx="10" />
      <rect x="62" y="124" width="22" height="70" rx="10" />
      <rect x="37.5" y="192" width="17" height="58" rx="8" />
      <rect x="65.5" y="192" width="17" height="58" rx="8" />
    </g>
  );
}

type BodyMapProps = {
  // Muscle name → number of exercises in this workout
  worked: Record<string, number>;
  // Lower-case muscle name → when it was last trained
  recent: Map<string, Date>;
  className?: string;
};

function Figure({
  label,
  regions,
  worked,
  recent,
}: {
  label: string;
  regions: Region[];
} & Pick<BodyMapProps, "worked" | "recent">) {
  // a muscle also counts for any alias that includes it, e.g. "core" → abs
  const sources = (muscle: string) => [
    muscle,
    ...Object.keys(ALIASES).filter((alias) => ALIASES[alias].includes(muscle)),
  ];
  const lowerWorked = Object.fromEntries(
    Object.entries(worked).map(([m, c]) => [m.toLowerCase(), c]),
  );
  const count = (muscle: string) =>
    sources(muscle).reduce((n, m) => n + (lowerWorked[m] ?? 0), 0);
  const lastTrained = (muscle: string) =>
    sources(muscle)
      .map((m) => recent.get(m))
      .reduce<Date | undefined>(
        (latest, d) => (d && (!latest || d > latest) ? d : latest),
        undefined,
      );

  return (
    <figure className="flex flex-col items-center gap-1">
      <svg
        viewBox="0 0 120 260"
        className="w-full max-w-28"
        role="img"
        aria-label={`${label} muscles`}
      >
        <Silhouette />
        {regions.map(({ muscle, shape }) => {
          const n = count(muscle);
          const trained = lastTrained(muscle);
          const details = [
            n > 0 && `${n} exercise${n === 1 ? "" : "s"} in this workout`,
            trained && `trained ${formatRelativeDay(trained)}`,
          ].filter(Boolean);
          return (
            <g
              key={muscle}
              className={cn(
                "transition-colors",
                n > 0
                  ? muscleFillClass(muscle)
                  : "fill-gray-300 dark:fill-zinc-700",
                trained &&
                  "stroke-amber-500 [stroke-dasharray:3_2] [stroke-width:1.5]",
              )}
            >
              <title>
                {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                {details.length ? ` — ${details.join(", ")}` : ""}
              </title>
              {shape}
            </g>
          );
        })}
      </svg>
      <figcaption className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </figcaption>
    </figure>
  );
}

const BodyMap = ({ worked, recent, className }: BodyMapProps) => (
  <div className={cn("flex flex-col gap-2", className)}>
    <div className="grid grid-cols-2 gap-2">
      <Figure label="Front" regions={FRONT} worked={worked} recent={recent} />
      <Figure label="Back" regions={BACK} worked={worked} recent={recent} />
    </div>
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-orange-400" />
        In this workout
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm border-[1.5px] border-dashed border-amber-500" />
        Trained in last {RECOVERY_HOURS}h
      </span>
    </div>
  </div>
);

export default BodyMap;
