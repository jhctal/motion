import type { CSSProperties } from "react";

// Decorative dashboard card in the brand orange: a dumbbell rising and
// settling over a shrinking shadow, with slow rings and twinkling sparkles
// behind it, and a reminder that changes daily. Animations are in index.css
// (.lift-*, .sleep-twinkle).

const REMINDERS = [
  "Every rep counts.",
  "Show up. Log it. Repeat.",
  "Progress loves consistency.",
  "Small sets add up.",
  "Rest is part of the plan.",
  "Stronger than last week.",
  "Form first, then weight.",
];

const SPARKLES = [
  { x: 34, y: 34, size: 6, delay: 0 },
  { x: 206, y: 28, size: 8, delay: -1.2 },
  { x: 214, y: 132, size: 5, delay: -0.5 },
  { x: 24, y: 128, size: 4, delay: -2 },
];

// Four-point sparkle centred on the origin
function sparklePath(s: number) {
  const k = s * 0.22;
  return `M0 ${-s}Q${k} ${-k} ${s} 0Q${k} ${k} 0 ${s}Q${-k} ${k} ${-s} 0Q${-k} ${-k} 0 ${-s}Z`;
}

// Plates on one side of the bar; the other side is mirrored around x=120
function Plates() {
  return (
    <>
      {/* collar */}
      <rect
        x="60"
        y="80"
        width="6"
        height="20"
        rx="2"
        className="fill-orange-200"
      />
      {/* big plate with an inset face for depth */}
      <rect
        x="44"
        y="56"
        width="14"
        height="68"
        rx="4"
        className="fill-white"
      />
      <rect
        x="48"
        y="64"
        width="6"
        height="52"
        rx="2"
        className="fill-orange-100"
      />
      {/* small plate */}
      <rect
        x="31"
        y="70"
        width="11"
        height="40"
        rx="3"
        className="fill-white"
      />
      <rect
        x="34.5"
        y="76"
        width="4"
        height="28"
        rx="1.5"
        className="fill-orange-100"
      />
    </>
  );
}

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

export function LiftArtWidget() {
  const reminder = REMINDERS[dayOfYear(new Date()) % REMINDERS.length];

  return (
    <section
      aria-label="Daily reminder"
      className="relative h-full min-h-64 overflow-hidden flex flex-col justify-between gap-4 p-5 rounded-xl bg-gradient-to-br from-orange-500 via-orange-500 to-orange-700 text-white shadow-sm"
    >
      {/* panning dot grid, shared with the auth panel */}
      <div
        aria-hidden="true"
        className="auth-dots pointer-events-none absolute inset-0 text-orange-100/20"
      />

      <p className="relative text-xs font-medium uppercase tracking-wider text-orange-100/90">
        Today's reminder
      </p>

      <svg
        viewBox="0 0 240 170"
        aria-hidden="true"
        className="relative w-full max-w-72 mx-auto overflow-visible"
      >
        {/* rings behind the dumbbell; the dashed one turns slowly */}
        <circle
          cx="120"
          cy="90"
          r="66"
          fill="none"
          strokeWidth="1.5"
          className="stroke-white/20"
        />
        <circle
          cx="120"
          cy="90"
          r="80"
          fill="none"
          strokeWidth="1.5"
          strokeDasharray="4 8"
          strokeLinecap="round"
          className="lift-spin stroke-orange-100/40"
        />

        {SPARKLES.map((s, i) => (
          <g key={i} transform={`translate(${s.x} ${s.y})`}>
            <path
              d={sparklePath(s.size)}
              className="sleep-twinkle fill-amber-200"
              style={{ animationDelay: `${s.delay}s` } as CSSProperties}
            />
          </g>
        ))}

        {/* shadow shrinks and fades as the dumbbell rises */}
        <ellipse
          cx="120"
          cy="150"
          rx="74"
          ry="6"
          className="lift-shadow fill-orange-900/40"
        />

        {/* effort lines under the plates, shown at the top of the lift */}
        <g
          className="lift-lines stroke-orange-100/80"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M42 134v8M52 136v10M62 134v8" />
          <path d="M178 134v8M188 136v10M198 134v8" />
        </g>

        <g className="lift-up">
          <rect
            x="64"
            y="86"
            width="112"
            height="8"
            rx="4"
            className="fill-orange-100"
          />
          {/* knurled grip */}
          <rect
            x="100"
            y="86"
            width="40"
            height="8"
            rx="2"
            className="fill-orange-200"
          />
          <Plates />
          <g transform="translate(240 0) scale(-1 1)">
            <Plates />
          </g>
        </g>
      </svg>

      <p className="relative text-2xl font-semibold leading-tight tracking-tight">
        {reminder}
      </p>
    </section>
  );
}
