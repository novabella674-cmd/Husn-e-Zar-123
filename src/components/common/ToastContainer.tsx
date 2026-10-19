import React from 'react';
import { ToastMessage } from '../../types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<Props> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map(toast => {
        let bgClass = 'bg-white text-[#1A1A1A] border-[#EEEEEE]';
        let iconColor = 'text-[#B88E8D]';
        let IconComponent = Info;

        if (toast.type === 'success') {
          bgClass = 'bg-white text-[#1A1A1A] border-emerald-100 shadow-lg';
          iconColor = 'text-emerald-500';
          IconComponent = CheckCircle2;
        } else if (toast.type === 'error') {
          bgClass = 'bg-white text-[#1A1A1A] border-rose-100 shadow-lg';
          iconColor = 'text-rose-500';
          IconComponent = AlertCircle;
        } else if (toast.type === 'warning') {
          bgClass = 'bg-white text-[#1A1A1A] border-amber-100 shadow-lg';
          iconColor = 'text-amber-500';
          IconComponent = AlertCircle;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 ${bgClass}`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-1.5 rounded-full bg-stone-50 ${iconColor} shrink-0`}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1A1A1A] tracking-wide">{toast.title}</h4>
                {toast.description && (
                  <p className="text-[11px] text-[#999999] mt-0.5 leading-relaxed">{toast.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#999999] hover:text-[#1A1A1A] p-1 transition-colors rounded-full hover:bg-[#F5F5F5]"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
