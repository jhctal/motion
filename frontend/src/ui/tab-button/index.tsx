import { PropsWithChildren } from "react";
import cn from "../../utils/cn";

type TabButtonProps = {
  active: boolean;
  key: string;
  onClick: () => void;
  className?: string;
};

const TabButton = ({
  active,
  children,
  className,
  key,
  onClick,
}: PropsWithChildren<TabButtonProps>) => {
  return (
    <button
      key={key}
      onClick={onClick}
      className={cn(
        "text-xs px-2 py-0.5 rounded transition-colors cursor-pointer",
        { "bg-orange-500 text-black font-semibold dark:text-white": active },
        {
          "text-gray-400 dark:text-gray-300 hover:text-black dark:text-gray-300 dark:hover:text-white":
            !active,
        },
        className,
      )}
    >
      {children}
    </button>
  );
};

export default TabButton;
