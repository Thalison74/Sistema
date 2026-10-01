import type { PeriodFilter } from "../types";
import { cn } from "../lib/cn";

interface Props {
  value: PeriodFilter;
  onChange: (value: PeriodFilter) => void;
}

const presets: { kind: PeriodFilter["kind"]; label: string }[] = [
  { kind: "today", label: "Hoje" },
  { kind: "last7_days", label: "Últimos 7 dias" },
  { kind: "last30_days", label: "Últimos 30 dias" },
  { kind: "this_month", label: "Este mês" },
  { kind: "all_time", label: "Todo período" },
  { kind: "custom", label: "Personalizado" },
];

export function PeriodFilterControl({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
        {presets.map((preset) => (
          <button
            key={preset.kind}
            onClick={() => {
              if (preset.kind === "custom") {
                onChange({ kind: "custom", start: value.kind === "custom" ? value.start : "", end: value.kind === "custom" ? value.end : "" });
              } else {
                onChange({ kind: preset.kind } as PeriodFilter);
              }
            }}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium transition-colors",
              value.kind === preset.kind
                ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                : "text-[color:var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {value.kind === "custom" && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={value.start}
            onChange={(e) => onChange({ kind: "custom", start: e.target.value, end: value.end })}
            className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs"
          />
          <span className="text-xs text-[color:var(--color-text-muted)]">até</span>
          <input
            type="date"
            value={value.end}
            onChange={(e) => onChange({ kind: "custom", start: value.start, end: e.target.value })}
            className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs"
          />
        </div>
      )}
    </div>
  );
}
