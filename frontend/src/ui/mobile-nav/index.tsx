import { Link, useRouter } from "@tanstack/react-router";
import { MoonIcon, SunIcon, XIcon } from "lucide-react";
import { useEffect } from "react";
import { navLinks } from "../sidebar/links";
import Switch from "../switch";
import useTheme from "../../hooks/use-theme";

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
};

const MobileNav = ({ open, onClose }: MobileNavProps) => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  // Close on route change
  useEffect(() => {
    return router.subscribe("onBeforeLoad", onClose);
  }, [router, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 z-50 h-dvh w-64 bg-white dark:bg-zinc-900 flex flex-col py-4 px-3 transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 px-1">
          <span className="italic text-black dark:text-white text-2xl select-none font-semibold">
            Motion
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-400 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <XIcon size={22} />
          </button>
        </div>

        {/* Links */}
        <nav className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 [&.active]:bg-black [&.active]:text-white dark:[&.active]:bg-white dark:[&.active]:text-black [&.active]:font-semibold transition-colors"
            >
              <link.icon size={20} />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-2 border-t border-gray-100 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2 rounded-lg p-2 text-sm text-gray-700 dark:text-gray-300">
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
              checkedIcon={<MoonIcon size={10} className="text-zinc-700" />}
              aria-label="Toggle dark mode"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNav;
