import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { Toaster, toast as sonnerToast } from 'sonner';
import type { ToastType } from '../components/ui/Toast';

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string, duration?: number) => string;
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const emit = useCallback(
    (type: ToastType, title: string, message?: string, duration?: number): string => {
      const opts = { description: message, duration: duration ?? 4500 };
      const id =
        type === 'success'
          ? sonnerToast.success(title, opts)
          : type === 'error'
            ? sonnerToast.error(title, opts)
            : type === 'warning'
              ? sonnerToast.warning(title, opts)
              : sonnerToast.info(title, opts);
      return String(id);
    },
    [],
  );

  const toast = useCallback(
    (type: ToastType, title: string, message?: string, duration?: number) =>
      emit(type, title, message, duration),
    [emit],
  );
  const success = useCallback(
    (title: string, message?: string, duration?: number) =>
      emit('success', title, message, duration),
    [emit],
  );
  const error = useCallback(
    (title: string, message?: string, duration?: number) =>
      emit('error', title, message, duration),
    [emit],
  );
  const info = useCallback(
    (title: string, message?: string, duration?: number) =>
      emit('info', title, message, duration),
    [emit],
  );
  const warning = useCallback(
    (title: string, message?: string, duration?: number) =>
      emit('warning', title, message, duration),
    [emit],
  );
  const dismiss = useCallback((id: string) => {
    sonnerToast.dismiss(id);
  }, []);
  const dismissAll = useCallback(() => {
    sonnerToast.dismiss();
  }, []);

  return (
    <ToastContext.Provider
      value={{ toast, success, error, info, warning, dismiss, dismissAll }}
    >
      {children}
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          className: 'font-sans border border-[var(--border)] shadow-md',
        }}
      />
    </ToastContext.Provider>
  );
};
