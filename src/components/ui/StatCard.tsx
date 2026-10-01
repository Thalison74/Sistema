import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface StatCardProps {
  label: string;
  value: ReactNode;
  tone?: "positive" | "negative" | "neutral";
  hint?: string;
}

export function StatCard({ label, value, tone = "neutral", hint }: StatCardProps) {
  const toneClass =
    tone === "positive"
      ? "text-[color:var(--color-positive)]"
      : tone === "negative"
        ? "text-[color:var(--color-negative)]"
        : "text-[color:var(--color-text)]";

  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", toneClass)}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-[color:var(--color-text-muted)]">{hint}</div>}
    </div>
  );
}
