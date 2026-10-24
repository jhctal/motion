import { useState } from "react";
import { CameraIcon, PauseIcon, PlayIcon } from "lucide-react";
import cn from "../../utils/cn";

type ExerciseImagesProps = {
  name: string;
  // [start, finish]
  images: string[];
};

const LABELS = ["Start", "Finish"];

// Start and finish photos side by side, with an option to loop between
// them so the pair reads as the movement
export function ExerciseImages({ name, images }: ExerciseImagesProps) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const shown = images.slice(0, 2).filter((_, i) => !failed.has(i));
  const canPlay = images.length >= 2 && failed.size === 0;

  if (shown.length === 0) return null;

  const frame =
    "relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-800";
  const label =
    "absolute left-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-medium text-gray-700 shadow-sm dark:bg-zinc-900/90 dark:text-gray-200";

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-sm font-medium text-gray-600 dark:text-gray-300">
          <span className="size-7 grid place-items-center rounded-lg bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400">
            <CameraIcon size={15} aria-hidden="true" />
          </span>
          Movement
        </h2>
        {canPlay && (
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-pressed={playing}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-orange-600 hover:bg-orange-500/10 dark:text-orange-400 transition-colors"
          >
            {playing ? (
              <PauseIcon size={14} aria-hidden="true" />
            ) : (
              <PlayIcon size={14} aria-hidden="true" />
            )}
            {playing ? "Show both" : "Play movement"}
          </button>
        )}
      </header>

      {playing && canPlay ? (
        // finish frame fades in and out over the start frame
        <div className={cn(frame, "aspect-[4/3] max-w-md")}>
          <img
            src={images[0]}
            alt={`${name}: start position`}
            className="absolute inset-0 size-full object-contain"
          />
          <img
            src={images[1]}
            alt={`${name}: finish position`}
            className="exercise-loop absolute inset-0 size-full object-contain"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {images.slice(0, 2).map((src, i) =>
            failed.has(i) ? null : (
              <figure key={src} className={cn(frame, "aspect-[4/3]")}>
                <img
                  src={src}
                  alt={`${name}: ${LABELS[i].toLowerCase()} position`}
                  loading="lazy"
                  onError={() => setFailed((f) => new Set(f).add(i))}
                  className="size-full object-contain"
                />
                <figcaption className={label}>{LABELS[i]}</figcaption>
              </figure>
            ),
          )}
        </div>
      )}
    </section>
  );
}
