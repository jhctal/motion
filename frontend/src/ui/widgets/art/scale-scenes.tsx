import { useId } from "react";
import type { ScaleScene } from "./daily";

// Scenes for the pale dashboard card (ScaleArtWidget), one shown per day.
// Each draws in a 240×180 viewBox centred on x=120, in white and orange
// with dark-mode variants. Animations are in index.css (.scale-needle,
// .tape-*, .bottle-*).

// url(#id) can't contain the characters React puts in useId values
function useSvgId(name: string) {
  return `${name}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
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

function Scale() {
  return (
    <>
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
    </>
  );
}

// Tape markings every 6 units, longer every fourth
const TAPE_TICKS = Array.from({ length: 26 }, (_, i) => ({
  x: 66 + i * 6,
  long: i % 4 === 0,
}));

function TapeMeasure() {
  const clip = useSvgId("tape-clip");
  return (
    <>
      <ellipse
        cx="128"
        cy="166"
        rx="80"
        ry="5"
        className="fill-orange-900/10 dark:fill-black/30"
      />
      {/* the tape slides out from under the case and back; clipped so the
          retracted end never pokes out of the case's far side */}
      <clipPath id={clip}>
        <rect x="92" y="100" width="148" height="60" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <g className="tape-extend">
          <rect
            x="60"
            y="134"
            width="156"
            height="18"
            rx="2"
            className="fill-amber-200 dark:fill-amber-300/80"
          />
          {TAPE_TICKS.map((t) => (
            <line
              key={t.x}
              x1={t.x}
              y1="134"
              x2={t.x}
              y2={t.long ? 143 : 139}
              strokeWidth="1.2"
              className="stroke-amber-700/60"
            />
          ))}
          {/* end hook */}
          <rect
            x="214"
            y="130"
            width="6"
            height="26"
            rx="2"
            className="fill-orange-500"
          />
        </g>
      </g>

      {/* case */}
      <circle
        cx="92"
        cy="108"
        r="50"
        strokeWidth="2"
        className="fill-white stroke-orange-200 dark:fill-zinc-800 dark:stroke-zinc-700"
      />
      <circle
        cx="92"
        cy="108"
        r="36"
        className="fill-orange-50 dark:fill-zinc-900"
      />
      {/* winding spiral, turning as the tape moves */}
      <path
        d="M92 108m-6 0a6 6 0 1 1 12 0a12 12 0 1 1 -24 0a18 18 0 1 1 36 0a24 24 0 1 1 -48 0"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        className="tape-spin stroke-orange-200 dark:stroke-orange-500/40"
      />
      <circle cx="92" cy="108" r="7" className="fill-orange-400" />
      {/* lock button on top */}
      <rect
        x="80"
        y="52"
        width="24"
        height="10"
        rx="4"
        className="fill-orange-400"
      />
    </>
  );
}

function WaterBottle() {
  const clip = useSvgId("bottle-clip");
  const body =
    "M98 66H142C148 66 152 70 152 76V150C152 158 146 164 138 164H102C94 164 88 158 88 150V76C88 70 92 66 98 66Z";
  return (
    <>
      <ellipse
        cx="120"
        cy="168"
        rx="44"
        ry="5"
        className="fill-orange-900/10 dark:fill-black/30"
      />
      {/* neck and cap */}
      <rect
        x="104"
        y="52"
        width="32"
        height="16"
        rx="4"
        className="fill-white stroke-orange-200 dark:fill-zinc-800 dark:stroke-zinc-700"
        strokeWidth="2"
      />
      <rect
        x="100"
        y="34"
        width="40"
        height="20"
        rx="6"
        className="fill-orange-400"
      />
      <rect
        x="108"
        y="28"
        width="24"
        height="8"
        rx="3"
        className="fill-orange-500"
      />

      <path
        d={body}
        strokeWidth="2"
        className="fill-white stroke-orange-200 dark:fill-zinc-800 dark:stroke-zinc-700"
      />
      {/* water: a wide wavy surface that slides sideways, clipped to the
          bottle, with bubbles rising through it */}
      <clipPath id={clip}>
        <path d={body} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <g className="bottle-wave">
          <path
            d="M40 104q12 -7 24 0t24 0t24 0t24 0t24 0t24 0t24 0V170H40Z"
            className="fill-sky-200 dark:fill-sky-400/40"
          />
        </g>
        {[
          { x: 104, r: 3, delay: 0 },
          { x: 122, r: 2, delay: -1.2 },
          { x: 136, r: 2.5, delay: -2.1 },
          { x: 112, r: 1.8, delay: -0.6 },
        ].map((b) => (
          <circle
            key={b.x}
            cx={b.x}
            cy="160"
            r={b.r}
            className="bottle-bubble fill-white/80 dark:fill-white/40"
            style={{ animationDelay: `${b.delay}s` }}
          />
        ))}
      </g>
      {/* measuring marks */}
      <path
        d="M140 84h6M140 100h6M140 116h6M140 132h6M140 148h6"
        strokeWidth="2"
        strokeLinecap="round"
        className="stroke-orange-300 dark:stroke-orange-500/50"
      />
      {/* shine */}
      <path
        d="M98 82V140"
        strokeWidth="4"
        strokeLinecap="round"
        className="stroke-white/80 dark:stroke-white/10"
      />
    </>
  );
}

export function ScaleSceneArt({ scene }: { scene: ScaleScene }) {
  switch (scene) {
    case "scale":
      return <Scale />;
    case "tape":
      return <TapeMeasure />;
    case "bottle":
      return <WaterBottle />;
  }
}
