import { Link } from "@tanstack/react-router";
import { MoonIcon, SunIcon } from "lucide-react";
import cn from "../../utils/cn";
import Switch from "../switch";
import ThemeIconToggle from "../theme-icon-toggle";
import { navGroups, navLinks } from "./links";
import { fadeLabel, rowClass } from "./styles";

// Shared by the desktop sidebar and the mobile drawer so they always match.
//
// Rows look the same collapsed or expanded (same height, icon in the same
// spot) so nothing jumps while the sidebar animates; only the text fades.

type NavListProps = {
  // Icon-only, for the collapsed desktop sidebar
  collapsed?: boolean;
};

export function NavList({ collapsed = false }: NavListProps) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-4">
      {navGroups.map((group) => (
        <div key={group} className="flex flex-col gap-0.5">
          {/* Heading keeps its height when collapsed; a short rule replaces the text */}
          <div className="relative h-5 px-3" aria-hidden={collapsed}>
            <p
              className={cn(
                "text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500",
                fadeLabel(collapsed),
              )}
            >
              {group}
            </p>
            <span
              className={cn(
                "absolute left-3 top-1/2 h-px w-4 bg-gray-200 dark:bg-zinc-700 transition-opacity duration-200",
                collapsed ? "opacity-100 delay-100" : "opacity-0",
              )}
            />
          </div>
          {navLinks
            .filter((link) => link.group === group)
            .map((link) => (
              <Link
                key={link.to}
                to={link.to}
                // "/" would otherwise be active on every page
                activeOptions={{ exact: link.to === "/" }}
                title={collapsed ? link.label : undefined}
                className={cn(
                  rowClass,
                  "group text-sm font-medium transition-colors",
                  "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-zinc-800 dark:hover:text-white",
                  "[&.active]:bg-orange-50 [&.active]:text-orange-700 dark:[&.active]:bg-orange-500/15 dark:[&.active]:text-orange-300",
                )}
              >
                <link.icon
                  size={18}
                  aria-hidden="true"
                  className="shrink-0 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 group-[.active]:text-orange-500"
                />
                {/* stays in the DOM so it's still the link's accessible name */}
                <span className={fadeLabel(collapsed)}>{link.label}</span>
              </Link>
            ))}
        </div>
      ))}
    </nav>
  );
}

type ThemeRowProps = {
  theme: "light" | "dark";
  onToggle: () => void;
  collapsed?: boolean;
};

// Sun/moon button always in the icon column; label and switch fade with the text
export function ThemeRow({
  theme,
  onToggle,
  collapsed = false,
}: ThemeRowProps) {
  return (
    <div
      className={cn(
        rowClass,
        "pr-3 justify-between text-sm text-gray-600 dark:text-gray-300",
      )}
    >
      <span className="flex items-center gap-3 min-w-0">
        <ThemeIconToggle
          theme={theme}
          onToggle={onToggle}
          className="shrink-0 text-gray-400 dark:text-gray-500"
        />
        <span className={fadeLabel(collapsed)}>
          {theme === "dark" ? "Dark mode" : "Light mode"}
        </span>
      </span>
      <span className={cn("shrink-0", fadeLabel(collapsed))} inert={collapsed}>
        <Switch
          checked={theme === "dark"}
          onCheckedChange={onToggle}
          icon={<SunIcon size={10} className="text-orange-500" />}
          checkedIcon={
            <MoonIcon size={10} className="text-zinc-700 dark:text-white" />
          }
          aria-label="Toggle dark mode"
        />
      </span>
    </div>
  );
}
