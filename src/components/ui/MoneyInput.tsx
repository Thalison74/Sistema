import { useEffect, useState, type KeyboardEvent } from "react";
import { formatCentsPlain, parseMoneyToCents } from "../../lib/money";
import { cn } from "../../lib/cn";

interface MoneyInputProps {
  cents: number | null;
  onChange: (cents: number | null) => void;
  allowEmpty?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export function MoneyInput({
  cents,
  onChange,
  allowEmpty = false,
  placeholder,
  className,
  inputClassName,
  disabled,
  onKeyDown,
}: MoneyInputProps) {
  const [raw, setRaw] = useState(() => (cents === null ? "" : formatCentsPlain(cents)));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (focused) return;
    setRaw(cents === null ? "" : formatCentsPlain(cents));
  }, [cents, focused]);

  return (
    <div className={cn("flex items-center gap-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 focus-within:border-[var(--color-accent)]", disabled && "opacity-60", className)}>
      {!(allowEmpty && raw === "" && !focused) && (
        <span className="text-xs text-[color:var(--color-text-muted)]">R$</span>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={raw}
        placeholder={placeholder ?? "0,00"}
        disabled={disabled}
        className={cn("w-full bg-transparent py-1.5 text-sm tabular-nums outline-none", inputClassName)}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          const value = e.target.value;
          setRaw(value);
          if (allowEmpty && value.trim() === "") {
            onChange(null);
            return;
          }
          onChange(parseMoneyToCents(value));
        }}
        onBlur={() => {
          setFocused(false);
          if (allowEmpty && raw.trim() === "") {
            onChange(null);
            return;
          }
          const parsed = parseMoneyToCents(raw);
          onChange(parsed);
          setRaw(formatCentsPlain(parsed));
        }}
      />
    </div>
  );
}
