import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | undefined>(undefined);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    setOptions(null);
    resolver.current?.(result);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg">
            <h2 className="text-base font-semibold">{options.title}</h2>
            <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">{options.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-surface-alt)]"
                onClick={() => close(false)}
              >
                {options.cancelLabel ?? "Cancelar"}
              </button>
              <button
                className={
                  options.danger
                    ? "rounded bg-[var(--color-negative)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                    : "rounded bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-[var(--color-accent-foreground)] hover:opacity-90"
                }
                onClick={() => close(true)}
              >
                {options.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
