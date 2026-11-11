import React, { useEffect, useState } from 'react';
import { ToastMessage, ToastType } from '../../types';
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertOctagon,
  X,
  Bell,
} from 'lucide-react';

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const duration = toast.duration ?? 4500;
  const [remainingMs, setRemainingMs] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const intervalMs = 50;
    const timer = setInterval(() => {
      setRemainingMs((prev) => Math.max(0, prev - intervalMs));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    if (remainingMs <= 0) {
      onDismiss(toast.id);
    }
  }, [remainingMs, onDismiss, toast.id]);

  const remainingPercent = Math.max(0, Math.min(100, (remainingMs / duration) * 100));

  const typeConfig: Record<
    ToastType,
    {
      borderColor: string;
      bgColor: string;
      barColor: string;
      iconColor: string;
      icon: React.ReactNode;
      badgeText: string;
    }
  > = {
    success: {
      borderColor: 'border-emerald-500/50',
      bgColor: 'bg-slate-900/95 shadow-emerald-950/40',
      barColor: 'bg-emerald-500',
      iconColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40',
      icon: <CheckCircle2 className="w-4 h-4" />,
      badgeText: 'نجاح',
    },
    info: {
      borderColor: 'border-teal-500/50',
      bgColor: 'bg-slate-900/95 shadow-teal-950/40',
      barColor: 'bg-teal-500',
      iconColor: 'text-teal-400 bg-teal-500/20 border-teal-500/40',
      icon: <Info className="w-4 h-4" />,
      badgeText: 'إشعار النظام',
    },
    warning: {
      borderColor: 'border-amber-500/50',
      bgColor: 'bg-slate-900/95 shadow-amber-950/40',
      barColor: 'bg-amber-500',
      iconColor: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
      icon: <AlertTriangle className="w-4 h-4" />,
      badgeText: 'تنبيه',
    },
    error: {
      borderColor: 'border-rose-500/50',
      bgColor: 'bg-slate-900/95 shadow-rose-950/40',
      barColor: 'bg-rose-500',
      iconColor: 'text-rose-400 bg-rose-500/20 border-rose-500/40',
      icon: <AlertOctagon className="w-4 h-4" />,
      badgeText: 'هام',
    },
  };

  const cfg = typeConfig[toast.type] || typeConfig.info;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${cfg.borderColor} ${cfg.bgColor} backdrop-blur-md p-3.5 sm:p-4 shadow-2xl transition-all duration-300 animate-slide-in-left group`}
      style={{ direction: 'rtl' }}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cfg.iconColor} shadow-inner mt-0.5`}
        >
          {cfg.icon}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-0.5">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
              {toast.title || cfg.badgeText}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">الآن</span>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-white leading-snug break-words">
            {toast.message}
          </p>

          {/* Optional Action Button */}
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                onDismiss(toast.id);
              }}
              className="mt-2 text-xs font-bold text-teal-300 hover:text-teal-200 underline underline-offset-4 transition-colors"
            >
              {toast.action.label} &larr;
            </button>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors shrink-0"
          title="إغلاق التنبيه"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Auto-Dismiss Countdown Progress Bar */}
      <div className="absolute bottom-0 right-0 left-0 h-1 bg-slate-800/80">
        <div
          className={`h-full ${cfg.barColor} transition-all duration-75 ease-linear`}
          style={{ width: `${remainingPercent}%` }}
        />
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
