import type { CSSProperties } from "react";

// Decorative dashboard card beside the weight chart: a bathroom scale whose
// needle swings, wobbles and settles, with twinkling sparkles, and a weigh-in
// tip that changes daily. Animations are in index.css (.scale-needle,
// .sleep-twinkle).

const TIPS = [
  "Weigh in at the same time each morning for the clearest trend.",
  "Daily numbers bounce around. The weekly trend is what counts.",
  "Water, salt and sleep all move the scale. Don't chase one reading.",
  "Log every weigh-in, even the ones you don't like.",
  "Pair the scale with measurements to see what it misses.",
];

const SPARKLES = [
  { x: 30, y: 40, size: 6, delay: 0 },
  { x: 212, y: 34, size: 7, delay: -1.4 },
  { x: 220, y: 140, size: 5, delay: -0.7 },
  { x: 22, y: 136, size: 4, delay: -2.1 },
];

// Four-point sparkle centred on the origin
function sparklePath(s: number) {
  const k = s * 0.22;
  return `M0 ${-s}Q${k} ${-k} ${s} 0Q${k} ${k} 0 ${s}Q${-k} ${k} ${-s} 0Q${-k} ${-k} 0 ${-s}Z`;
}

// Dial ticks every 15° across the top arc, longer at the ends and middle
const TICKS = Array.from({ length: 9 }, (_, i) => {
  const angle = ((-60 + i * 15) * Math.PI) / 180;
  const long = i % 4 === 0;
  const outer = 30;
  const inner = long ? 23 : 26;
  return {
    x1: 120 + Math.sin(angle) * inner,
    y1: 96 - Math.cos(angle) * inner,
    x2: 120 + Math.sin(angle) * outer,
    y2: 96 - Math.cos(angle) * outer,
    long,
  };
});

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

export function ScaleArtWidget() {
  const tip = TIPS[dayOfYear(new Date()) % TIPS.length];

  return (
    <section
      aria-label="Weigh-in tip"
      className="relative h-full min-h-64 overflow-hidden flex flex-col justify-between gap-4 p-5 rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 via-amber-50/60 to-white shadow-sm dark:border-zinc-800 dark:from-orange-500/10 dark:via-zinc-900 dark:to-zinc-900"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-orange-600 dark:text-orange-400">
        Weigh-in tip
      </p>

      <svg
        viewBox="0 0 240 180"
        aria-hidden="true"
        className="w-full max-w-64 mx-auto overflow-visible"
      >
        {/* soft glow behind the scale */}
        <circle
          cx="120"
          cy="96"
          r="78"
          className="fill-orange-200/50 dark:fill-orange-500/10"
        />

        {SPARKLES.map((s, i) => (
          <g key={i} transform={`translate(${s.x} ${s.y})`}>
            <path
              d={sparklePath(s.size)}
              className="sleep-twinkle fill-amber-300 dark:fill-amber-200"
              style={{ animationDelay: `${s.delay}s` } as CSSProperties}
            />
          </g>
        ))}

        {/* shadow */}
        <ellipse
          cx="120"
          cy="166"
          rx="64"
          ry="5"
          className="fill-orange-900/10 dark:fill-black/30"
        />

        {/* scale body */}
        <rect
          x="52"
          y="40"
          width="136"
          height="122"
          rx="30"
          strokeWidth="2"
          className="fill-white stroke-orange-200 dark:fill-zinc-800 dark:stroke-zinc-700"
        />

        {/* dial window */}
        <rect
          x="82"
          y="56"
          width="76"
          height="48"
          rx="14"
          className="fill-orange-50 dark:fill-zinc-900"
        />
        {TICKS.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            strokeWidth={t.long ? 2 : 1.5}
            strokeLinecap="round"
            className={
              t.long
                ? "stroke-orange-400"
                : "stroke-orange-300 dark:stroke-orange-500/60"
            }
          />
        ))}

        {/* needle pivots on the hub at (120, 96) */}
        <line
          x1="120"
          y1="96"
          x2="120"
          y2="70"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="scale-needle stroke-orange-500"
        />
        <circle cx="120" cy="96" r="4" className="fill-orange-500" />

        {/* foot pads */}
        <rect
          x="74"
          y="114"
          width="38"
          height="36"
          rx="13"
          className="fill-orange-100 dark:fill-orange-500/20"
        />
        <rect
          x="128"
          y="114"
          width="38"
          height="36"
          rx="13"
          className="fill-orange-100 dark:fill-orange-500/20"
        />
        {/* grip ridges on the pads */}
        <g
          strokeWidth="2"
          strokeLinecap="round"
          className="stroke-orange-200 dark:stroke-orange-500/30"
        >
          <path d="M84 124h18M84 132h18M84 140h18" />
          <path d="M138 124h18M138 132h18M138 140h18" />
        </g>
      </svg>

      <p className="text-base font-medium leading-snug text-gray-800 dark:text-gray-200">
        {tip}
      </p>
    </section>
  );
}
