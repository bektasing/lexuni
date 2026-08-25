import { useEffect } from 'react';
import type { ReactNode } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="relative bg-surface rounded-3xl shadow-xl border border-border w-full max-w-md animate-in fade-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-tx">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-tx-muted hover:text-tx hover:bg-surface-hover rounded-xl transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
