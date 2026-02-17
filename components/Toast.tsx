"use client";

export type ToastItem = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const typeStyles = {
  success: "bg-emerald-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-indigo-600 text-white",
};

export default function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 shadow-lg ${typeStyles[t.type]}`}
        >
          <span className="text-sm font-medium">{t.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="shrink-0 rounded p-1 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
