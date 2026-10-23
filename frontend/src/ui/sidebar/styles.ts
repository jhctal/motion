import cn from "../../utils/cn";

// Text that slides in from the left once the sidebar has widened, and fades
// straight out when it collapses
export function fadeLabel(collapsed: boolean) {
  return cn(
    "whitespace-nowrap transition-[opacity,translate] duration-200",
    collapsed
      ? "opacity-0 -translate-x-2 pointer-events-none"
      : "opacity-100 translate-x-0 delay-100",
  );
}

// 11px side padding centres an 18px icon in the 64px collapsed sidebar
export const rowClass =
  "h-10 flex items-center gap-3 px-[11px] rounded-lg overflow-hidden";
