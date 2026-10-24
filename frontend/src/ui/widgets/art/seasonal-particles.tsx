import cn from "../../../utils/cn";
import type { Season } from "./daily";

// Particles drifting behind a card's drawing, one set per season: snow in
// winter, blossom in spring, fireflies in summer, leaves in autumn. Drawn in
// a 240-wide viewBox; they fall or rise past its edges and the card clips
// them. Animations are in index.css (.art-*).

// "onOrange" for the solid orange card, "onLight" for the pale one
export type ParticleTone = "onOrange" | "onLight";

type Particle = {
  x: number;
  delay: number;
  duration: number;
  size: number;
  colour: number;
};

// Spread across the width, staggered so a few are always in view
const LAYOUT: Particle[] = [
  { x: 14, delay: 0, duration: 9, size: 1, colour: 0 },
  { x: 46, delay: -4.5, duration: 11, size: 0.8, colour: 1 },
  { x: 78, delay: -2, duration: 10, size: 1.1, colour: 2 },
  { x: 108, delay: -7, duration: 12, size: 0.9, colour: 0 },
  { x: 142, delay: -1, duration: 9.5, size: 1.2, colour: 1 },
  { x: 170, delay: -5.5, duration: 11.5, size: 0.8, colour: 2 },
  { x: 198, delay: -3, duration: 10.5, size: 1, colour: 0 },
  { x: 228, delay: -8, duration: 12.5, size: 0.9, colour: 1 },
];

const COLOURS: Record<Season, Record<ParticleTone, string[]>> = {
  winter: {
    onOrange: ["fill-white/90", "fill-orange-50/80", "fill-white/70"],
    onLight: [
      "fill-sky-200 dark:fill-sky-100/70",
      "fill-slate-300 dark:fill-white/60",
      "fill-sky-100 dark:fill-sky-200/60",
    ],
  },
  spring: {
    onOrange: ["fill-rose-100", "fill-white/90", "fill-pink-200"],
    onLight: ["fill-pink-300", "fill-rose-200", "fill-pink-200"],
  },
  summer: {
    onOrange: ["fill-amber-100", "fill-yellow-100", "fill-white"],
    onLight: ["fill-amber-400", "fill-yellow-400", "fill-orange-300"],
  },
  autumn: {
    onOrange: ["fill-amber-200", "fill-yellow-100", "fill-orange-200"],
    onLight: ["fill-orange-500", "fill-amber-500", "fill-red-400"],
  },
};

// Six-armed flake, stroked, centred on the origin
const FLAKE =
  "M0 -5V5M-4.3 -2.5L4.3 2.5M-4.3 2.5L4.3 -2.5M-1.5 -4L0 -2.6L1.5 -4M-1.5 4L0 2.6L1.5 4";
// Leaf with a pointed tip, centred on the origin
const LEAF = "M0 -8C5 -6 6.5 2 0 8C-6.5 2 -5 -6 0 -8Z";
// Rounded petal, centred on the origin
const PETAL = "M0 -5C3.4 -3.4 3.4 3 0 5C-3.4 3 -3.4 -3.4 0 -5Z";

function Shape({
  season,
  index,
  className,
}: {
  season: Season;
  index: number;
  className: string;
}) {
  switch (season) {
    case "winter":
      // mostly soft dots, every third one a proper flake
      return index % 3 === 0 ? (
        <path
          d={FLAKE}
          fill="none"
          strokeWidth="1.4"
          strokeLinecap="round"
          className={className.replace(/fill-/g, "stroke-")}
        />
      ) : (
        <circle r="2.6" className={className} />
      );
    case "spring":
      return <path d={PETAL} className={className} />;
    case "summer":
      return (
        <>
          <circle r="6" className={className} opacity={0.25} />
          <circle r="2.2" className={className} />
        </>
      );
    case "autumn":
      return (
        <>
          <path d={LEAF} className={className} />
          <path d="M0 -6.5V7" strokeWidth="0.8" className="stroke-black/15" />
        </>
      );
  }
}

// Which way the particles travel and how they move on the way
const MOTION: Record<Season, { travel: string; spin: string }> = {
  winter: { travel: "art-fall", spin: "art-sway" },
  spring: { travel: "art-drift", spin: "art-tumble" },
  summer: { travel: "art-rise", spin: "art-glow" },
  autumn: { travel: "art-fall", spin: "art-flutter" },
};

export function SeasonalParticles({
  season,
  tone,
}: {
  season: Season;
  tone: ParticleTone;
}) {
  const colours = COLOURS[season][tone];
  const { travel, spin } = MOTION[season];
  // fireflies start low and rise; everything else starts above the top
  const startY = season === "summer" ? 150 : -12;

  return (
    <g aria-hidden="true" className="art-particles">
      {LAYOUT.map((p, i) => (
        // position (attribute) > travel (CSS) > inner motion (CSS) > size;
        // separate groups because a CSS transform replaces the attribute
        <g key={i} transform={`translate(${p.x} ${startY})`}>
          <g
            className={travel}
            style={{
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          >
            <g
              // alternate particles move the other way so they don't march
              className={cn(
                spin,
                i % 2 === 1 && "[animation-direction:reverse]",
              )}
              style={{ animationDelay: `${p.delay / 2}s` }}
            >
              <g transform={`scale(${p.size})`}>
                <Shape
                  season={season}
                  index={i}
                  className={colours[p.colour]}
                />
              </g>
            </g>
          </g>
        </g>
      ))}
    </g>
  );
}
