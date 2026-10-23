import type { PropsWithChildren } from "react";
import cn from "../../utils/cn";

type CollapseProps = PropsWithChildren<{
  open: boolean;
  id?: string;
  // Applied to the content, so padding doesn't leak into the closed height
  className?: string;
}>;

// Animates height by transitioning grid rows 0fr ↔ 1fr, which needs no
// measuring. Content stays mounted; `inert` keeps hidden controls out of
// the tab order and away from screen readers while closed.
const Collapse = ({ open, id, className, children }: CollapseProps) => (
  <div
    id={id}
    inert={!open}
    className={cn(
      "grid transition-[grid-template-rows] duration-150 ease-out motion-reduce:transition-none",
      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
    )}
  >
    <div className="min-h-0 overflow-hidden">
      <div className={className}>{children}</div>
    </div>
  </div>
);

export default Collapse;
