import { LiftSceneArt } from "./art/lift-scenes";
import { SeasonalParticles } from "./art/seasonal-particles";
import {
  LIFT_SCENES,
  SEASONS,
  pickDaily,
  previewOverride,
  seasonOf,
} from "./art/daily";

// Decorative dashboard card in the brand orange. A different piece of kit
// each day (dumbbell, barbell, kettlebell, running shoe) over slow rings,
// with the season drifting behind it and a reminder that changes daily.

const REMINDERS = [
  "Every rep counts.",
  "Show up. Log it. Repeat.",
  "Progress loves consistency.",
  "Small sets add up.",
  "Rest is part of the plan.",
  "Stronger than last week.",
  "Form first, then weight.",
];

export function LiftArtWidget() {
  const scene = previewOverride("art", LIFT_SCENES) ?? pickDaily(LIFT_SCENES);
  const season = previewOverride("season", SEASONS) ?? seasonOf();
  const reminder = pickDaily(REMINDERS);

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
      {/* the season, drifting across the whole card behind everything */}
      <svg
        aria-hidden="true"
        viewBox="0 0 240 200"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 size-full"
      >
        <SeasonalParticles season={season} tone="onOrange" />
      </svg>

      <p className="relative text-xs font-medium uppercase tracking-wider text-orange-100/90">
        Today's reminder
      </p>

      <svg
        viewBox="0 0 240 170"
        aria-hidden="true"
        className="relative w-full max-w-72 mx-auto overflow-visible"
      >
        {/* rings behind the scene; the dashed one turns slowly */}
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
        <LiftSceneArt scene={scene} />
      </svg>

      <p className="relative text-2xl font-semibold leading-tight tracking-tight">
        {reminder}
      </p>
    </section>
  );
}
