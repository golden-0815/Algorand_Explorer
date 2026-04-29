import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, isVisible, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return 'bg-yellow-500/10 border-yellow-500/20';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-2" role="alert" aria-live="polite" aria-atomic="true">
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-md border shadow-lg backdrop-blur
        bg-algo-dark/95 border-algo-gray-light/20
        ${getBgColor()}
      `}>
        {getIcon()}
        <span className="text-sm font-medium text-algo-text tracking-tight">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded-md hover:bg-algo-gray-light/20 transition-colors"
          aria-label="Close notification"
        >
          <X className="h-3 w-3 text-algo-text" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
} 