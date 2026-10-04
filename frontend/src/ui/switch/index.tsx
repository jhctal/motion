import type { ButtonHTMLAttributes, ReactNode } from "react";
import cn from "../../utils/cn";

type SwitchProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "value"
> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon?: ReactNode;
  checkedIcon?: ReactNode;
};

const Switch = ({
  checked,
  onCheckedChange,
  icon,
  checkedIcon,
  className,
  disabled,
  ...props
}: SwitchProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        checked ? "bg-orange-500" : "bg-gray-300",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center size-4 rounded-full bg-white dark:bg-zinc-800 shadow transition-transform text-gray-500",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      >
        {checked ? checkedIcon : icon}
      </span>
    </button>
  );
};

export default Switch;
