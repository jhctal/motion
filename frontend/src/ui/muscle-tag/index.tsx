import cn from "../../utils/cn";
import { muscleTagClass } from "./colours";

type MuscleTagProps = {
  muscle: string;
  // Shown as "×n" after the name when more than one
  count?: number;
  className?: string;
};

const MuscleTag = ({ muscle, count, className }: MuscleTagProps) => (
  <span
    className={cn(
      "text-xs px-1.5 py-0.5 rounded capitalize shrink-0",
      muscleTagClass(muscle),
      className,
    )}
  >
    {muscle}
    {count !== undefined && count > 1 && (
      <span className="ml-1 font-semibold">×{count}</span>
    )}
  </span>
);

export default MuscleTag;
