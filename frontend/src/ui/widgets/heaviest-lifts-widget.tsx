import { useMainLifts } from "../../api/personal-records/use-personal-records";

export function HeaviestLiftsWidget() {
  const { data, isLoading } = useMainLifts();

  const lifts = [...(data ?? [])].sort((a, b) => {
    if (a.weight != null && b.weight == null) return -1;
    if (a.weight == null && b.weight != null) return 1;
    return 0;
  });
  const hasAnyLift = lifts.some((lift) => lift.weight != null);

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3">
      <p className="text-xs text-gray-400 dark:text-gray-300 uppercase tracking-wide">
        Heaviest Lifts
      </p>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : !hasAnyLift ? (
        <p className="text-sm text-gray-500">
          Log a workout to start tracking your heaviest lifts.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {lifts.map((lift) => (
            <div
              key={lift.key}
              className="flex flex-col gap-0.5 border rounded-lg px-3 py-2"
            >
              <span className="text-xs text-gray-400 dark:text-gray-300">
                {lift.label}
              </span>
              {lift.weight != null ? (
                <span className="text-lg font-bold leading-tight">
                  {lift.weight}
                  <span className="text-sm font-normal text-gray-400 dark:text-gray-300 ml-0.5">
                    kg
                  </span>
                </span>
              ) : (
                <span className="text-lg font-bold text-gray-600 leading-tight">
                  —
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
