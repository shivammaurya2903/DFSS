import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.slice(0, 5).map((toast) => {
        let Icon = Info;
        let colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
        let iconColor = 'text-blue-500';

        switch (toast.type) {
          case 'success':
            Icon = CheckCircle2;
            colorClasses = 'bg-green-50 text-green-800 border-green-200';
            iconColor = 'text-green-500';
            break;
          case 'error':
            Icon = XCircle;
            colorClasses = 'bg-red-50 text-red-800 border-red-200';
            iconColor = 'text-red-500';
            break;
          case 'warning':
            Icon = AlertTriangle;
            colorClasses = 'bg-yellow-50 text-yellow-800 border-yellow-200';
            iconColor = 'text-yellow-500';
            break;
          case 'info':
          default:
            Icon = Info;
            colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
            iconColor = 'text-blue-500';
            break;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start p-4 border rounded-lg shadow-lg transform transition-all duration-300 translate-x-0 opacity-100 ${colorClasses}`}
            role="alert"
          >
            <Icon className={`w-5 h-5 mr-3 shrink-0 ${iconColor}`} />
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => onRemove(toast.id)}
              className="ml-4 shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
