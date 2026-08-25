import re

with open('src/components/Modal.tsx', 'r') as f:
    content = f.read()

new_modal = """import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setShouldRender(true);
  }, [isOpen]);

  const onAnimationEnd = () => {
    if (!isOpen) setShouldRender(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onAnimationEnd={onAnimationEnd}
    >
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm duration-200 ${isOpen ? 'motion-safe:animate-in motion-safe:fade-in' : 'motion-safe:animate-out motion-safe:fade-out'}`} 
        onClick={onClose}
      />
      <div className={`relative bg-surface rounded-3xl shadow-xl border border-border w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] duration-200 ${isOpen ? 'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-[0.97]' : 'motion-safe:animate-out motion-safe:fade-out motion-safe:zoom-out-[0.97]'}`}>
        <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-tx">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-tx-muted hover:text-tx hover:bg-surface-hover rounded-xl transition-colors btn-primary"
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
"""

with open('src/components/Modal.tsx', 'w') as f:
    f.write(new_modal)
