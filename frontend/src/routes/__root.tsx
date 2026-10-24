import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { MobileNav, Sidebar, TopBar } from "../ui";

const AUTH_PATHS = ["/auth", "/register"];

function RootLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  // auth pages render their own theme toggle inside AuthLayout
  if (isAuthPage) {
    return (
      <div className="min-h-dvh text-gray-900 dark:text-white">
        <Outlet />
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
