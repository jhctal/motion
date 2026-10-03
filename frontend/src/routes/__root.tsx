import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { MobileNav, Sidebar, TopBar } from "../ui";

const AUTH_PATHS = ["/auth", "/register"];

function RootLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  if (isAuthPage) {
    return (
      <div className="h-dvh bg-white">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex bg-gray-300 dark:bg-zinc-800">
      <Sidebar />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
      <hr />
      <div className="h-dvh w-full">
        <TopBar onMenuOpen={() => setMenuOpen(true)} />
        <div className="h-[calc(100dvh-48px)] bg-white dark:bg-zinc-800 dark:text-white py-6 px-4 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
