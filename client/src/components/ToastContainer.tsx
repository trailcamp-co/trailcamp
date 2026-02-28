import { X } from 'lucide-react';
import type { Toast } from '../hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border backdrop-blur-lg animate-slide-up flex items-center gap-3 min-w-[280px] ${
            toast.type === 'success'
              ? 'bg-green-500/90 text-white border-green-400/50'
              : toast.type === 'error'
              ? 'bg-red-500/90 text-white border-red-400/50'
              : 'bg-dark-800/95 text-gray-100 border-dark-700/50'
          }`}
        >
          <span className="flex-shrink-0 text-lg">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
