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
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            autoFocus
            className="min-h-11 rounded-xl border border-border bg-surface px-5 py-3 font-bold text-tx-secondary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-28"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`min-h-11 rounded-xl px-5 py-3 font-bold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-32 ${
              danger ? 'bg-danger-btn hover:bg-danger-btn-hover' : 'bg-primary hover:bg-primary-hover'
            }`}
          >
            {isPending ? 'Working…' : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="flex gap-4">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${danger ? 'bg-danger-bg text-danger-tx' : 'bg-warning-bg text-warning-tx'}`}>
          <AlertTriangle size={22} aria-hidden="true" />
        </div>
        <p className="min-w-0 self-center leading-relaxed text-tx-secondary">{description}</p>
      </div>
    </Modal>
  );
}
