import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDownIcon, LogOutIcon, MenuIcon, UserIcon } from "lucide-react";
import useLogout from "../../api/authentication/use-logout";
import Dropdown from "../dropdown";
import ConfirmModal from "../modal/confirm-modal";

type TopBarProps = {
  onMenuOpen: () => void;
};

const TopBar = ({ onMenuOpen }: TopBarProps) => {
  const goTo = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  return (
    <div className="h-12 flex items-center bg-zinc-900 w-full drop-shadow-2xl px-3 gap-3">
      {/* Hamburger — only visible on mobile/tablet */}
      <button
        type="button"
        onClick={onMenuOpen}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded text-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
        aria-label="Open navigation"
      >
        <MenuIcon size={22} />
      </button>

      <div className="flex-1 flex justify-end gap-2">
        {/* <button className={buttonStyles} disabled>
          Notifications
        </button> */}
        {/* <button className={buttonStyles} disabled>
          Language
        </button> */}

        <Dropdown>
          <Dropdown.Trigger className="flex items-center gap-1 h-10 px-4 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors">
            <UserIcon />
            <ChevronDownIcon size={16} />
          </Dropdown.Trigger>

          <Dropdown.Content>
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
              Logout
            </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown>
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => logout()}
        title="Log out?"
        description="You'll need to sign in again to access your account."
        confirmLabel="Log out"
        destructive
        isPending={isLoggingOut}
      />
    </div>
  );
};

export default TopBar;
