import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import clsx from 'clsx';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastCtx = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (m) => push(m, 'success'),
      error: (m) => push(m, 'error'),
      info: (m) => push(m, 'info'),
      warning: (m) => push(m, 'warning'),
    }),
    [push]
  );

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(
              'card pointer-events-auto px-4 py-3 shadow-lift flex items-center gap-3 animate-slide-in',
              t.type === 'success' && 'border-l-4 !border-l-clinical-success',
              t.type === 'error' && 'border-l-4 !border-l-clinical-danger',
              t.type === 'warning' && 'border-l-4 !border-l-clinical-warning',
              t.type === 'info' && 'border-l-4 !border-l-clinical-info'
            )}
          >
            <Icon
              name={t.type === 'success' ? 'checkCircle' : t.type === 'error' ? 'alert' : 'info'}
              size={16}
              className={clsx(
                'shrink-0',
                t.type === 'success' && 'text-clinical-success',
                t.type === 'error' && 'text-clinical-danger',
                t.type === 'warning' && 'text-clinical-warning',
                t.type === 'info' && 'text-clinical-info'
              )}
            />
            <div className="text-sm text-ink font-medium">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
