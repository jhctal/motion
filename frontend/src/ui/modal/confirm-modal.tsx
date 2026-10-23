import { useId, type ComponentType } from "react";
import Button from "../button/button";
import cn from "../../utils/cn";
import Modal from "./index";

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isPending?: boolean;
  // Shown in a tinted chip beside the title
  icon?: ComponentType<{ size?: number; className?: string }>;
};

const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  isPending,
  icon: Icon,
}: ConfirmModalProps) => {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={description ? descriptionId : undefined}
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <span
            className={cn(
              "size-10 shrink-0 grid place-items-center rounded-full",
              destructive
                ? "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                : "bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400",
            )}
          >
            <Icon size={18} aria-hidden="true" />
          </span>
        )}
        <div className="flex flex-col gap-1 pt-0.5">
          <h2
            id={titleId}
            className="text-base font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </h2>
          {description && (
            <p
              id={descriptionId}
              className="text-sm text-gray-500 dark:text-gray-400"
            >
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-2">
        {/* the safe choice gets focus, so Enter can't confirm by accident */}
        <Button
          variant="outline"
          className="flex-1"
          onClick={onClose}
          autoFocus
        >
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? "destructive" : "default"}
          className="flex-1"
          disabled={isPending}
          onClick={onConfirm}
        >
          {isPending ? "Please wait..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
