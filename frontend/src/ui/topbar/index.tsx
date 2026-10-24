import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  LogOutIcon,
  MenuIcon,
  PlusIcon,
  UserIcon,
} from "lucide-react";
import useLogout from "../../api/authentication/use-logout";
import Dropdown from "../dropdown";
import ConfirmModal from "../modal/confirm-modal";
import { navLinks } from "../sidebar/links";

type TopBarProps = {
  onMenuOpen: () => void;
};

type StoredUser = { first_name?: string; last_name?: string; email?: string };

// Saved at login, so the avatar needs no extra request
function readStoredUser(): StoredUser {
  try {
    return JSON.parse(localStorage.getItem("user") ?? "{}");
  } catch {
    return {};
  }
}

// The nav section for a path, plus a label for the page within it
function locate(pathname: string) {
  const section = navLinks.find((link) =>
    link.to === "/"
      ? pathname === "/"
      : pathname === link.to || pathname.startsWith(`${link.to}/`),
  );
  if (!section || pathname === section.to) return { section, page: undefined };
  return {
    section,
    page: pathname.endsWith("/new") ? "New" : "Details",
  };
}

const TopBar = ({ onMenuOpen }: TopBarProps) => {
  const goTo = useNavigate();
  const { pathname } = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [user] = useState(readStoredUser);
  const { mutate: logout, isPending: isLoggingOut } = useLogout({
    onError: (err: Error) => {
      console.log(err);
    },
    onSuccess: () => {
      console.log("successfully logged out");
      localStorage.removeItem("user");
      goTo({ to: "/auth" });
    },
  });

  const { section, page } = locate(pathname);
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const initials =
    [user.first_name, user.last_name]
      .map((n) => n?.charAt(0))
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";
  const onNewLog = pathname === "/my-logs/new";

  return (
    <header className="relative z-30 h-12 flex items-center gap-2 px-3 lg:px-5 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
      {/* Hamburger — only on mobile/tablet, where the sidebar is hidden */}
      <button
        type="button"
        onClick={onMenuOpen}
        className="lg:hidden size-9 -ml-1 grid place-items-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
        aria-label="Open navigation"
      >
        <MenuIcon size={20} />
      </button>

      {/* Where you are */}
      <nav aria-label="Breadcrumb" className="flex-1 min-w-0">
        {section ? (
          <ol className="flex items-center gap-1.5 text-sm min-w-0">
            <li className="min-w-0">
              <Link
                to={section.to}
                className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white hover:text-orange-500 transition-colors"
              >
                <section.icon
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-orange-500"
                />
                <span className="truncate">{section.label}</span>
              </Link>
            </li>
            {page && (
              <>
                <li aria-hidden="true">
                  <ChevronRightIcon size={14} className="text-gray-400" />
                </li>
                <li
                  aria-current="page"
                  className="truncate text-gray-500 dark:text-gray-400"
                >
                  {page}
                </li>
              </>
            )}
          </ol>
        ) : (
          <span className="text-sm font-semibold italic">Motion</span>
        )}
      </nav>

      {/* Quick action */}
      {!onNewLog && (
        <Link
          to="/my-logs/new"
          aria-label="Log workout"
          className="flex items-center gap-1.5 h-8 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors px-2 sm:px-3"
        >
          <PlusIcon size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Log workout</span>
        </Link>
      )}

      {/* Account */}
      <Dropdown>
        <Dropdown.Trigger
          aria-label="Account menu"
          className="flex items-center gap-1.5 h-9 pl-1 pr-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <span className="size-7 grid place-items-center rounded-full bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 text-xs font-semibold">
            {initials}
          </span>
          {user.first_name && (
            <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-200 capitalize">
              {user.first_name}
            </span>
          )}
          <ChevronDownIcon
            size={14}
            aria-hidden="true"
            className="text-gray-400"
          />
        </Dropdown.Trigger>

        <Dropdown.Content className="min-w-56">
          {(fullName || user.email) && (
            <div className="px-3 py-2 mb-1 border-b border-gray-100 dark:border-zinc-800">
              {fullName && (
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize truncate">
                  {fullName}
                </p>
              )}
              {user.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              )}
            </div>
          )}
          <Dropdown.Item
            icon={<UserIcon size={16} />}
            onClick={() => goTo({ to: "/profile" })}
          >
            Profile
          </Dropdown.Item>
          <Dropdown.Item
            icon={<LogOutIcon size={16} />}
            destructive
            onClick={() => setShowLogoutConfirm(true)}
          >
            Log out
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown>

      <ConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => logout()}
        title="Log out?"
        description="You'll need to sign in again to access your account."
        confirmLabel="Log out"
        destructive
        icon={LogOutIcon}
        isPending={isLoggingOut}
      />
    </header>
  );
};

export default TopBar;
