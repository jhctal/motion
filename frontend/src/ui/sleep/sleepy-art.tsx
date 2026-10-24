import type { CSSProperties } from "react";
import cn from "../../utils/cn";

// Night-sky illustration: a crescent moon with stars twinkling around it and
// a stream of Zs drifting up and away. Animations live in index.css
// (.sleep-z, .sleep-twinkle, .sleep-moon).

// Each Z floats up and to the right, fading in and out. Negative delays
// start them mid-flight so the stream is already flowing on first paint.
const ZS = [
  { x: 118, y: 92, size: 9, delay: 0, duration: 6 },
  { x: 132, y: 74, size: 14, delay: -1.2, duration: 6.5 },
  { x: 150, y: 60, size: 10, delay: -2.6, duration: 5.5 },
  { x: 164, y: 44, size: 20, delay: -3.4, duration: 7 },
  { x: 186, y: 34, size: 12, delay: -4.6, duration: 6 },
  { x: 140, y: 100, size: 7, delay: -5.2, duration: 5 },
  { x: 202, y: 54, size: 16, delay: -1.8, duration: 7.5 },
  { x: 176, y: 78, size: 8, delay: -3.9, duration: 5.5 },
];

const STARS = [
  { x: 22, y: 30, size: 5, delay: 0 },
  { x: 118, y: 22, size: 7, delay: -1.1 },
  { x: 36, y: 128, size: 4, delay: -0.6 },
  { x: 222, y: 112, size: 6, delay: -1.8 },
  { x: 214, y: 16, size: 4, delay: -2.4 },
  { x: 104, y: 138, size: 5, delay: -0.3 },
];

// A stroked Z centred on the origin
function zPath(s: number) {
  const h = s / 2;
  return `M${-h} ${-h}H${h}L${-h} ${h}H${h}`;
}

// Four-point sparkle centred on the origin
function starPath(s: number) {
  const k = s * 0.22;
  return `M0 ${-s}Q${k} ${-k} ${s} 0Q${k} ${k} 0 ${s}Q${-k} ${k} ${-s} 0Q${-k} ${-k} 0 ${-s}Z`;
}

export function SleepyArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 160"
      aria-hidden="true"
      className={cn("overflow-visible", className)}
    >
      {/* soft glow behind the moon */}
      <circle
        cx="62"
        cy="84"
        r="56"
        className="fill-orange-200/50 dark:fill-orange-500/10"
      />

      {/* crescent moon: outer arc down the left, then a narrower inner arc
          back up, leaving a band about 22 units thick at its widest */}
      <g className="sleep-moon">
        <path
          d="M80 40A44 44 0 1 0 80 128A22 44 0 1 1 80 40Z"
          className="fill-orange-300 dark:fill-orange-400"
        />
        {/* craters near the tips */}
        <circle cx="54" cy="60" r="3" className="fill-orange-400/40" />
        <circle cx="55" cy="110" r="2.5" className="fill-orange-400/40" />
        {/* sleepy closed eye and a little smile in the widest part */}
        <path
          d="M42 81q4 3.5 8 0"
          fill="none"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="stroke-orange-700/70 dark:stroke-orange-900/80"
        />
        <path
          d="M44 94q3 2.5 6 0"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          className="stroke-orange-700/50 dark:stroke-orange-900/60"
        />
      </g>

      {STARS.map((s, i) => (
        <g key={i} transform={`translate(${s.x} ${s.y})`}>
          <path
            d={starPath(s.size)}
            className="sleep-twinkle fill-amber-300 dark:fill-amber-200"
            style={{ animationDelay: `${s.delay}s` } as CSSProperties}
          />
        </g>
      ))}

      {ZS.map((z, i) => (
        <g key={i} transform={`translate(${z.x} ${z.y})`}>
          <path
            d={zPath(z.size)}
            fill="none"
            strokeWidth={Math.max(1.6, z.size / 6)}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sleep-z stroke-orange-500 dark:stroke-orange-400"
            style={
              {
                animationDelay: `${z.delay}s`,
                animationDuration: `${z.duration}s`,
              } as CSSProperties
            }
          />
        </g>
      ))}
    </svg>
  );
}
