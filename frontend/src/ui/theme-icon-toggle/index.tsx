import { MoonIcon, SunIcon } from "lucide-react";
import cn from "../../utils/cn";

type ThemeIconToggleProps = {
  // pass in from the caller's useTheme() so its other UI stays in sync
  theme: "light" | "dark";
  onToggle: () => void;
  className?: string;
};

const ThemeIconToggle = ({ theme, onToggle, className }: ThemeIconToggleProps) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label="Toggle dark mode"
    className={cn(
      "cursor-pointer hover:text-orange-500 transition-colors",
      className,
    )}
  >
    {theme === "dark" ? <MoonIcon size={18} /> : <SunIcon size={18} />}
  </button>
);

export default ThemeIconToggle;
