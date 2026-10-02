import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { motion } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export const ToastItem: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons: Record<ToastType, React.ElementType> = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors: Record<ToastType, string> = {
    success: 'bg-emerald-950/90 border-emerald-700/60 text-emerald-200',
    error: 'bg-rose-950/90 border-rose-700/60 text-rose-200',
    warning: 'bg-amber-950/90 border-amber-700/60 text-amber-200',
    info: 'bg-blue-950/90 border-blue-700/60 text-blue-200',
  };

  const Icon = icons[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`p-3.5 rounded-xl border shadow-2xl flex items-start gap-3 backdrop-blur-md min-w-[300px] max-w-sm ${colors[toast.type]}`}
      role="alert"
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold tracking-tight">{toast.title}</h4>
        {toast.message && <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">{toast.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded text-slate-400 hover:text-slate-100 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};
