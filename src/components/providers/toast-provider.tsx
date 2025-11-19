"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastRecord = ToastInput & {
  id: string;
  createdAt: number;
  variant: ToastVariant;
  duration: number;
};

type ToastContextValue = {
  addToast: (toast: ToastInput) => string;
  removeToast: (toastId: string) => void;
};

const DEFAULT_DURATION = 4000;

const ToastContext = createContext<ToastContextValue | null>(null);

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));

    const timeoutId = timersRef.current.get(toastId);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timersRef.current.delete(toastId);
    }
  }, []);

  const addToast = useCallback(
    ({ title, description, variant = "info", duration = DEFAULT_DURATION }: ToastInput) => {
      const id = generateId();
      const toastRecord: ToastRecord = {
        id,
        title,
        description,
        variant,
        duration,
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev, toastRecord]);

      const timeoutId = window.setTimeout(() => {
        removeToast(id);
      }, duration);

      timersRef.current.set(id, timeoutId);

      return id;
    },
    [removeToast],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timers.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  info: "border-slate-200 bg-white text-slate-900",
};

const indicatorStyles: Record<ToastVariant, string> = {
  success: "bg-emerald-500",
  error: "bg-rose-500",
  info: "bg-slate-900",
};

type ToastViewportProps = {
  toasts: ToastRecord[];
  onDismiss: (toastId: string) => void;
};

const ToastViewport = ({ toasts, onDismiss }: ToastViewportProps) => {
  return (
    <div
      aria-live="assertive"
  className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 px-4 pb-6 sm:items-end sm:justify-end"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border shadow-lg transition",
            variantStyles[toast.variant],
          )}
          role="status"
        >
          <div className="flex h-full items-start gap-3 p-4">
            <span className={cn("mt-1 h-2 w-2 rounded-full", indicatorStyles[toast.variant])} aria-hidden="true" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold leading-5">{toast.title}</p>
              {toast.description ? (
                <p className="text-sm text-slate-600">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => onDismiss(toast.id)}
              className="rounded-full p-1 text-slate-500 transition hover:bg-slate-200/70 hover:text-slate-700"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
};
