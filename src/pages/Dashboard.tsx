import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { api, errorMessage } from "../lib/tauri";
import { formatDateBr } from "../lib/date";
import { formatCurrency, formatSignedCurrency } from "../lib/money";
import type { DashboardData, PeriodFilter } from "../types";
import { StatCard } from "../components/ui/StatCard";
import { ResultBadge } from "../components/ui/ResultBadge";
import { PeriodFilterControl } from "../components/PeriodFilterControl";
import { useToast } from "../hooks/useToast";
import { createSessionAndNavigate } from "../lib/sessionActions";

export function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [period, setPeriod] = useState<PeriodFilter>({ kind: "all_time" });
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (period.kind === "custom" && (!period.start || !period.end)) return;
    setLoading(true);
    api
      .dashboardGet(period)
      .then(setData)
      .catch((err) => toast(errorMessage(err), "error"))
      .finally(() => setLoading(false));
  }, [period, toast]);

  const chartData = (data?.chart ?? []).map((p) => ({
    name: p.name,
    date: formatDateBr(p.date),
    acumulado: p.cumulative_cents / 100,
    resultado: p.result_cents / 100,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-sm text-[color:var(--color-text-muted)]">Visão geral dos seus resultados</p>
        </div>
        <button
          onClick={() => createSessionAndNavigate(navigate, toast)}
          className="flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-3.5 py-2 text-sm font-medium text-[var(--color-accent-foreground)] hover:opacity-90"
        >
          <Plus size={16} /> Nova Sessão
        </button>
      </div>

      <PeriodFilterControl value={period} onChange={setPeriod} />

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Resultado Total"
              value={formatSignedCurrency(data.total_cents)}
              tone={data.total_cents > 0 ? "positive" : data.total_cents < 0 ? "negative" : "neutral"}
            />
            <StatCard label="Lucros" value={formatCurrency(data.profit_cents)} tone="positive" />
            <StatCard label="Perdas" value={`-${formatCurrency(data.loss_cents)}`} tone="negative" />
            <StatCard label="Sessões" value={data.session_count} />
          </div>

          <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="mb-3 text-sm font-semibold">Evolução do Resultado</h2>
            {chartData.length === 0 ? (
              <p className="py-10 text-center text-sm text-[color:var(--color-text-muted)]">
                Nenhuma sessão no período selecionado.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="accentFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                    formatter={(value, key) => [
                      `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                      key === "acumulado" ? "Acumulado" : "Resultado da sessão",
                    ]}
                    labelFormatter={(label, items) => {
                      const date = (items?.[0]?.payload as { date?: string } | undefined)?.date;
                      return date ? `${label} • ${date}` : label;
                    }}
                  />
                  <Area type="monotone" dataKey="acumulado" stroke="var(--color-accent)" strokeWidth={2} fill="url(#accentFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="mb-3 text-sm font-semibold">Estatísticas</h2>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <StatRow label="Melhor sessão">
                {data.stats.best_session ? (
                  <div className="flex items-center gap-2">
                    <span>{data.stats.best_session.name}</span>
                    <ResultBadge cents={data.stats.best_session.result_cents} size="sm" />
                  </div>
                ) : (
                  <span className="text-[color:var(--color-text-muted)]">—</span>
                )}
              </StatRow>
              <StatRow label="Pior sessão">
                {data.stats.worst_session ? (
                  <div className="flex items-center gap-2">
                    <span>{data.stats.worst_session.name}</span>
                    <ResultBadge cents={data.stats.worst_session.result_cents} size="sm" />
                  </div>
                ) : (
                  <span className="text-[color:var(--color-text-muted)]">—</span>
                )}
              </StatRow>
              <StatRow label="Média por sessão">
                <ResultBadge cents={data.stats.average_cents} size="sm" />
              </StatRow>
              <StatRow label="Sessões positivas">{data.stats.positive_count}</StatRow>
              <StatRow label="Sessões negativas">{data.stats.negative_count}</StatRow>
              <StatRow label="Resultado acumulado">
                <ResultBadge cents={data.stats.accumulated_cents} size="sm" />
              </StatRow>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-[color:var(--color-text-muted)]">{label}</div>
      <div className="mt-0.5 font-medium">{children}</div>
    </div>
  );
}
