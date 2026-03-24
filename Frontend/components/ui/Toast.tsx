import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'info':
        return <Info className={`${iconClass} text-blue-500`} />;
      default:
        return <Info className={`${iconClass} text-blue-500`} />;
    }
  };

  const getToastStyles = () => {
    const baseStyles = "transform transition-all duration-300 ease-in-out";
    
    if (!isVisible && !isLeaving) {
      return `${baseStyles} translate-x-full opacity-0`;
    }
    
    if (isLeaving) {
      return `${baseStyles} translate-x-full opacity-0`;
    }
    
    return `${baseStyles} translate-x-0 opacity-100`;
  };

  const getBackgroundStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      className={`
        ${getToastStyles()}
        ${getBackgroundStyles()}
        border rounded-lg shadow-lg p-4 mb-4 min-w-[320px] max-w-[400px]
        flex items-start gap-3
      `}
      role="alert"
      aria-live="polite"
    >
      {getIcon()}
      
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
        {message && (
          <p className="text-gray-600 text-sm mt-1">{message}</p>
        )}
      </div>
      
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-md hover:bg-gray-200 transition-colors"
        aria-label="Fermer"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
};

export default Toast;
