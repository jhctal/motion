import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { MobileNav, Sidebar, TopBar } from "../ui";
import ThemeIconToggle from "../ui/theme-icon-toggle";
import useTheme from "../hooks/use-theme";

const AUTH_PATHS = ["/auth", "/register"];

function RootLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);
  const { theme, toggleTheme } = useTheme();

  if (isAuthPage) {
    return (
      <div className="h-dvh bg-white text-black dark:bg-zinc-800 dark:text-white">
        <Outlet />
        <ThemeIconToggle
          theme={theme}
          onToggle={toggleTheme}
          className="fixed bottom-4 left-4 p-2"
        />
      </div>
    );
  }

  return (
    <div className="flex bg-gray-300 dark:bg-zinc-800">
      <Sidebar />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="h-dvh flex-1 min-w-0">
        <TopBar onMenuOpen={() => setMenuOpen(true)} />
        <div className="h-[calc(100dvh-48px)] bg-white dark:bg-zinc-800 dark:text-white pt-6 pb-16 md:pb-6 px-4 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
