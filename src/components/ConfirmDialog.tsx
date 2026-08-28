import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  danger?: boolean;
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isPending = false,
  danger = false
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      dismissible={!isPending}
      footer={
        <div className="modal-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            autoFocus
            data-autofocus
            className="button button-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`button ${danger ? 'button-danger' : 'button-primary'}`}
          >
            {isPending ? 'Working…' : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="dialog-message">
        <div className={`dialog-message-icon ${danger ? 'dialog-message-icon-danger' : 'dialog-message-icon-warning'}`}>
          <AlertTriangle size={22} aria-hidden="true" />
        </div>
        <p>{description}</p>
      </div>
    </Modal>
  );
}
