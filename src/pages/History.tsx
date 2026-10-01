import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import { api, errorMessage } from "../lib/tauri";
import type { SessionSummary } from "../types";
import { SessionRow } from "../components/SessionRow";
import { useConfirm } from "../hooks/useConfirm";
import { useToast } from "../hooks/useToast";

export function History() {
  const confirm = useConfirm();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .sessionList({
        sort: "newest",
        search: search || null,
        date_from: dateFrom || null,
        date_to: dateTo || null,
      })
      .then(setSessions)
      .catch((err) => toast(errorMessage(err), "error"))
      .finally(() => setLoading(false));
  }, [search, dateFrom, dateTo, toast]);

  useEffect(() => {
    const timeout = setTimeout(load, 200);
    return () => clearTimeout(timeout);
  }, [load]);

  const handleDelete = async (session: SessionSummary) => {
    const ok = await confirm({
      title: "Excluir sessão",
      message: `Tem certeza que deseja excluir "${session.name}"? Essa ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.sessionDelete(session.id);
      toast("Sessão excluída.");
      load();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Histórico</h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">Pesquise e filtre sessões anteriores</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5">
          <Search size={15} className="text-[color:var(--color-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome da sessão..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm"
        />
        <span className="text-xs text-[color:var(--color-text-muted)]">até</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm"
        />
      </div>

      <div className="space-y-2">
        {!loading && sessions.length === 0 && (
          <p className="py-12 text-center text-sm text-[color:var(--color-text-muted)]">
            Nenhuma sessão encontrada para os filtros selecionados.
          </p>
        )}
        {sessions.map((s) => (
          <SessionRow key={s.id} session={s} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
