import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastType, ToastProps } from '../components/ui/Toast';

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string, duration?: number) => string;
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

interface ToastItem extends Omit<ToastProps, 'onClose'> {}

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
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const generateId = () => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    duration?: number
  ): string => {
    const id = generateId();
    const newToast: ToastItem = {
      id,
      type,
      title,
      message,
      duration,
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    duration?: number
  ) => {
    return addToast(type, title, message, duration);
  }, [addToast]);

  const success = useCallback((
    title: string,
    message?: string,
    duration?: number
  ) => {
    return addToast('success', title, message, duration);
  }, [addToast]);

  const error = useCallback((
    title: string,
    message?: string,
    duration?: number
  ) => {
    return addToast('error', title, message, duration);
  }, [addToast]);

  const info = useCallback((
    title: string,
    message?: string,
    duration?: number
  ) => {
    return addToast('info', title, message, duration);
  }, [addToast]);

  const warning = useCallback((
    title: string,
    message?: string,
    duration?: number
  ) => {
    return addToast('warning', title, message, duration);
  }, [addToast]);

  const dismiss = useCallback((id: string) => {
    removeToast(id);
  }, [removeToast]);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextType = {
    toast,
    success,
    error,
    info,
    warning,
    dismiss,
    dismissAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              {...toast}
              onClose={removeToast}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};
