import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, title, message, confirmLabel = 'Igen', cancelLabel = 'Mégse',
  onConfirm, onCancel
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-5 backdrop-blur-sm animate-fade-in">
      <div className="bg-bg-panel border border-border-subtle rounded-[32px] p-6 max-w-sm w-full space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-yellow-500" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-neutral-500 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl border border-border-subtle text-neutral-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-brand-orange text-black font-black text-[10px] uppercase tracking-widest transition-all active:scale-95">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
