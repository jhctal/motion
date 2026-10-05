import Button from "../button/button";
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
}: ConfirmModalProps) => {
  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-300">
          {description}
        </p>
      )}

      <div className="flex gap-3 mt-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
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
