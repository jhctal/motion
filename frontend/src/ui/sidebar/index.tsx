import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import cn from "../../utils/cn";
import useTheme from "../../hooks/use-theme";
import { NavList, ThemeRow } from "./nav-list";
import { fadeLabel, rowClass } from "./styles";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sidebar-collapsed") === "true",
  );
  const { theme, toggleTheme } = useTheme();

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebar-collapsed", String(newState));
      return newState;
    });
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex h-dvh shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 transition-[width] duration-300",
        collapsed ? "w-16" : "w-56",
      )}
    >
      {/* Brand, same height as the top bar so their borders line up.
          The logo stays put; the name fades in beside it. */}
      <Link
        to="/"
        aria-label="Motion home"
        className="h-12 shrink-0 flex items-center gap-2.5 px-4 border-b border-gray-200 dark:border-zinc-800 select-none overflow-hidden"
      >
        <img
          src={
            theme === "dark"
              ? "/assets/logo-dark.png"
              : "/assets/logo-light.png"
          }
          alt=""
          className="size-8 shrink-0"
        />
        <span
          className={cn(
            "text-xl font-semibold italic text-gray-900 dark:text-white",
            fadeLabel(collapsed),
          )}
        >
          Motion
        </span>
      </Link>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <NavList collapsed={collapsed} />
      </div>

      <div className="flex flex-col gap-1 px-3 py-3 border-t border-gray-200 dark:border-zinc-800">
        <ThemeRow theme={theme} onToggle={toggleTheme} collapsed={collapsed} />
        <button
          type="button"
          onClick={handleToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : undefined}
          className={cn(
            rowClass,
            "text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors",
          )}
        >
          {collapsed ? (
            <PanelLeftOpenIcon
              size={18}
              aria-hidden="true"
              className="shrink-0"
            />
          ) : (
            <PanelLeftCloseIcon
              size={18}
              aria-hidden="true"
              className="shrink-0"
            />
          )}
          <span className={fadeLabel(collapsed)} aria-hidden="true">
            Collapse
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
