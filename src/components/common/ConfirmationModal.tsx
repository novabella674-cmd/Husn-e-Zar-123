import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<Props> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  let btnClass = 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs';
  if (variant === 'warning') btnClass = 'bg-amber-600 hover:bg-amber-700 text-white';
  if (variant === 'info') btnClass = 'bg-[#1A1A1A] hover:bg-[#333333] text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white text-[#1A1A1A] rounded-2xl border border-[#EEEEEE] shadow-xl p-6 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#999999] hover:text-[#1A1A1A] p-1 rounded-full hover:bg-[#F5F5F5] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1A1A1A]">{title}</h3>
            <p className="text-xs text-[#999999]">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-xs text-[#1A1A1A] mb-6 leading-relaxed bg-[#FAFAFA] p-3.5 rounded-xl border border-[#EEEEEE]">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-[#EEEEEE] text-[#1A1A1A] hover:bg-[#F5F5F5] text-xs font-medium transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer ${btnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
