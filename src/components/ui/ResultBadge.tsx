import { formatSignedCurrency } from "../../lib/money";
import { cn } from "../../lib/cn";

interface ResultBadgeProps {
  cents: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ResultBadge({ cents, size = "md", className }: ResultBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-0.5",
    lg: "text-xl px-0 py-0",
  }[size];

  if (cents === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded font-medium text-[color:var(--color-pending)]",
          size !== "lg" && "bg-[var(--color-pending-bg)]",
          sizeClasses,
          className,
        )}
      >
        Pendente
      </span>
    );
  }

  const tone =
    cents > 0 ? "positive" : cents < 0 ? "negative" : "neutral";

  const toneClasses =
    tone === "positive"
      ? "text-[color:var(--color-positive)]"
      : tone === "negative"
        ? "text-[color:var(--color-negative)]"
        : "text-[color:var(--color-text-muted)]";

  const bgClasses =
    size === "lg"
      ? ""
      : tone === "positive"
        ? "bg-[var(--color-positive-bg)]"
        : tone === "negative"
          ? "bg-[var(--color-negative-bg)]"
          : "bg-[var(--color-surface-alt)]";

  return (
    <span className={cn("inline-flex items-center gap-1 rounded font-semibold tabular-nums", toneClasses, bgClasses, sizeClasses, className)}>
      {formatSignedCurrency(cents)}
    </span>
  );
}
