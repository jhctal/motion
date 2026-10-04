import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  MoonIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SunIcon,
} from "lucide-react";
import cn from "../../utils/cn";
import { navLinks } from "./links";
import Button from "../button/button";
import Switch from "../switch";
import useTheme from "../../hooks/use-theme";

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

  const linkStyles = cn(
    "bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center transition-all duration-300",
    collapsed ? "w-11" : "w-48",
  );

  const toggleStyles =
    "p-2 w-full flex gap-2 justify-center items-center rounded-lg";

  return (
    <div
      className={cn(
        "hidden lg:flex h-dvh bg-white dark:bg-zinc-900 py-2 px-2 flex-col transition-all duration-300 drop-shadow-lg drop-shadow-gray-500 dark:drop-shadow-black/40",
        collapsed ? "w-16" : "w-52",
      )}
    >
      <div className="flex items-center justify-center bg-white dark:bg-zinc-900 text-black dark:text-white italic h-12 mb-6 text-2xl select-none transition-all duration-300">
        {!collapsed ? (
          <span className="font-semibold italic">Motion</span>
        ) : (
          <img
            src={
              theme === "dark"
                ? "/assets/logo-dark.png"
                : "/assets/logo-light.png"
            }
            className="size-12"
          />
        )}
      </div>
      <div className="h-full flex flex-col gap-2">
        {navLinks.map((link) => (
          <div key={link.to} className={linkStyles}>
            <Button className="w-full p-0" variant="ghost">
              <Link
                to={link.to}
                className="p-2 [&.active]:font-bold w-full flex gap-2 [&.active]:bg-black [&.active]:text-white dark:[&.active]:bg-white dark:[&.active]:text-black justify- rounded-lg"
              >
                <link.icon /> {!collapsed && link.label}
              </Link>
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
        <div
          className={cn(
            "flex items-center rounded-lg p-2 text-sm text-gray-700 dark:text-gray-300",
            collapsed ? "justify-center" : "justify-between gap-2",
          )}
        >
          {collapsed ? (
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="cursor-pointer hover:text-orange-500 transition-colors"
            >
              {theme === "dark" ? (
                <MoonIcon size={18} />
              ) : (
                <SunIcon size={18} />
              )}
            </button>
          ) : (
            <>
              <span className="flex items-center gap-2">
                {theme === "dark" ? (
                  <MoonIcon size={18} />
                ) : (
                  <SunIcon size={18} />
                )}
                {theme === "dark" ? "Dark mode" : "Light mode"}
              </span>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
                icon={<SunIcon size={10} className="text-orange-500" />}
                checkedIcon={
                  <MoonIcon
                    size={10}
                    className="text-zinc-700 dark:text-white"
                  />
                }
                aria-label="Toggle dark mode"
              />
            </>
          )}
        </div>

        <Button
          className="w-full p-0"
          variant="ghost"
          onClick={handleToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className={toggleStyles}>
            {collapsed ? (
              <PanelLeftOpenIcon size={18} />
            ) : (
              <PanelLeftCloseIcon size={18} />
            )}
            {!collapsed && "Collapse"}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
