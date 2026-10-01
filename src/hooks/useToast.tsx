import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

interface Toast {
  id: number;
  message: string;
  tone: "success" | "error";
}

type ToastFn = (message: string, tone?: Toast["tone"]) => void;

const ToastContext = createContext<ToastFn | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback<ToastFn>((message, tone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded border px-3 py-2 text-sm shadow-sm",
              t.tone === "error"
                ? "border-[var(--color-negative)] bg-[var(--color-negative-bg)] text-[color:var(--color-negative)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[color:var(--color-text)]",
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
