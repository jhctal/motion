import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import cn from "../../utils/cn";

type DropdownContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
  const ctx = useContext(DropdownContext);
  if (!ctx)
    throw new Error(
      "Dropdown compound components must be used within a Dropdown",
    );
  return ctx;
}

type DropdownProps = PropsWithChildren<{
  className?: string;
}>;

const Dropdown = ({ children, className }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className={cn("relative", className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

type DropdownTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;

const DropdownTrigger = ({
  children,
  className,
  ...props
}: DropdownTriggerProps) => {
  const { open, setOpen } = useDropdownContext();

  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
};

type DropdownContentProps = PropsWithChildren<{
  align?: "left" | "right";
  className?: string;
}>;

const DropdownContent = ({
  children,
  align = "right",
  className,
}: DropdownContentProps) => {
  const { open } = useDropdownContext();

  if (!open) return null;

  return (
    <div
      role="menu"
      className={cn(
        "absolute z-50 top-full mt-1 min-w-40 py-1 rounded-lg bg-white border border-gray-200 shadow-lg dark:bg-zinc-900 dark:border-zinc-700",
        align === "right" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
};

type DropdownItemProps = PropsWithChildren<{
  onClick?: () => void;
  icon?: ReactNode;
  destructive?: boolean;
  className?: string;
}>;

const DropdownItem = ({
  children,
  onClick,
  icon,
  destructive,
  className,
}: DropdownItemProps) => {
  const { setOpen } = useDropdownContext();

  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        setOpen(false);
        onClick?.();
      }}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-800 transition-colors",
        destructive &&
          "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
};

Dropdown.Trigger = DropdownTrigger;
Dropdown.Content = DropdownContent;
Dropdown.Item = DropdownItem;

export default Dropdown;
