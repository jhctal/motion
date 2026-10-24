import { FrownIcon, LaughIcon, MehIcon, SmileIcon } from "lucide-react";
import type { SleepQuality } from "../../utils/sleep";

// Better nights get a stronger orange, so the chart reads at a glance
export const QUALITY_STYLES: Record<
  SleepQuality,
  { label: string; bar: string; icon: typeof SmileIcon }
> = {
  poor: {
    label: "Poor",
    bar: "bg-orange-200 dark:bg-orange-900",
    icon: FrownIcon,
  },
  fair: {
    label: "Fair",
    bar: "bg-orange-300 dark:bg-orange-700",
    icon: MehIcon,
  },
  good: {
    label: "Good",
    bar: "bg-orange-500",
    icon: SmileIcon,
  },
  excellent: {
    label: "Excellent",
    bar: "bg-orange-600 dark:bg-orange-300",
    icon: LaughIcon,
  },
};
