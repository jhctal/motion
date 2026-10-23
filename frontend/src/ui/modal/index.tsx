import { useEffect, type PropsWithChildren } from "react";
import cn from "../../utils/cn";

type ModalProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  className?: string;
}>;

const Modal = ({ open, onClose, children, className }: ModalProps) => {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "w-full max-w-sm lg:max-w-md rounded-lg bg-white dark:bg-zinc-900 p-6 flex flex-col gap-4 shadow-lg",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
