import { ScaleSceneArt } from "./art/scale-scenes";
import { SeasonalParticles } from "./art/seasonal-particles";
import {
  SCALE_SCENES,
  SEASONS,
  pickDaily,
  previewOverride,
  seasonOf,
} from "./art/daily";

// Decorative dashboard card beside the weight chart. A different scene each
// day (scale, tape measure, water bottle) on a soft glow, with the season
// drifting behind it and a weigh-in tip that changes daily.

const TIPS = [
  "Weigh in at the same time each morning for the clearest trend.",
  "Daily numbers bounce around. The weekly trend is what counts.",
  "Water, salt and sleep all move the scale. Don't chase one reading.",
  "Log every weigh-in, even the ones you don't like.",
  "Pair the scale with measurements to see what it misses.",
];

export function ScaleArtWidget() {
  const scene = previewOverride("art", SCALE_SCENES) ?? pickDaily(SCALE_SCENES);
  const season = previewOverride("season", SEASONS) ?? seasonOf();
  const tip = pickDaily(TIPS);

  return (
    <section
      aria-label="Weigh-in tip"
      className="relative h-full min-h-64 overflow-hidden flex flex-col justify-between gap-4 p-5 rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 via-amber-50/60 to-white shadow-sm dark:border-zinc-800 dark:from-orange-500/10 dark:via-zinc-900 dark:to-zinc-900"
    >
      {/* the season, drifting across the whole card behind everything */}
      <svg
        aria-hidden="true"
        viewBox="0 0 240 200"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 size-full"
      >
        <SeasonalParticles season={season} tone="onLight" />
      </svg>

      <p className="relative text-xs font-medium uppercase tracking-wider text-orange-600 dark:text-orange-400">
        Weigh-in tip
      </p>

      <svg
        viewBox="0 0 240 180"
        aria-hidden="true"
        className="relative w-full max-w-64 mx-auto overflow-visible"
      >
        {/* soft glow behind the scene */}
        <circle
          cx="120"
          cy="100"
          r="78"
          className="fill-orange-200/50 dark:fill-orange-500/10"
        />
        <ScaleSceneArt scene={scene} />
      </svg>

      <p className="relative text-base font-medium leading-snug text-gray-800 dark:text-gray-200">
        {tip}
      </p>
    </section>
  );
}
