import { useEffect, useRef, type PropsWithChildren } from "react";
import { createPortal } from "react-dom";
import cn from "../../utils/cn";

type ModalProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  className?: string;
  // ids of the title / description, so screen readers announce them
  labelledBy?: string;
  describedBy?: string;
}>;

const Modal = ({
  open,
  onClose,
  children,
  className,
  labelledBy,
  describedBy,
}: ModalProps) => {
  const returnFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    // put focus back where it was (e.g. the menu button) once closed
    returnFocusTo.current = document.activeElement as HTMLElement | null;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      returnFocusTo.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  // Portal to <body>: an ancestor with a filter/transform (like the blurred
  // top bar) would otherwise trap this fixed overlay inside its own box
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-200 starting:opacity-0"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={cn(
          "w-full max-w-sm flex flex-col gap-4 p-6 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900",
          // fade and scale in on open; nothing to undo on close
          "transition-[opacity,scale] duration-200 ease-out starting:opacity-0 starting:scale-95 motion-reduce:transition-none",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
