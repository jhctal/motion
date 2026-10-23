import { useRouter } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { useEffect } from "react";
import useTheme from "../../hooks/use-theme";
import cn from "../../utils/cn";
import { NavList, ThemeRow } from "../sidebar/nav-list";

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

  // Prevent body scroll when open, and close on Escape
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
      />

      {/* Drawer */}
      <aside
        inert={!open}
        aria-label="Navigation"
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-dvh w-72 max-w-[85vw] flex flex-col border-r border-gray-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header, same height as the top bar */}
        <div className="h-12 shrink-0 flex items-center justify-between pl-5 pr-2 border-b border-gray-200 dark:border-zinc-800">
          <span className="text-xl font-semibold italic text-gray-900 dark:text-white select-none">
            Motion
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="size-9 grid place-items-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavList />
        </div>

        <div className="px-3 py-3 border-t border-gray-200 dark:border-zinc-800">
          <ThemeRow theme={theme} onToggle={toggleTheme} />
        </div>
      </aside>
    </>
  );
};

export default MobileNav;
