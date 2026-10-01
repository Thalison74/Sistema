import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { api, errorMessage } from "../lib/tauri";
import type { SessionSummary, SortOption } from "../types";
import { SessionRow } from "../components/SessionRow";
import { useConfirm } from "../hooks/useConfirm";
import { useToast } from "../hooks/useToast";
import { createSessionAndNavigate } from "../lib/sessionActions";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Mais recentes" },
  { value: "oldest", label: "Mais antigas" },
  { value: "highest_profit", label: "Maior lucro" },
  { value: "highest_loss", label: "Maior perda" },
];

export function Sessions() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const [sort, setSort] = useState<SortOption>("newest");
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .sessionList({ sort })
      .then(setSessions)
      .catch((err) => toast(errorMessage(err), "error"))
      .finally(() => setLoading(false));
  }, [sort, toast]);

  useEffect(() => {
    load();
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Sessões</h1>
          <p className="text-sm text-[color:var(--color-text-muted)]">Todas as suas sessões registradas</p>
        </div>
        <button
          onClick={() => createSessionAndNavigate(navigate, toast)}
          className="flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-3.5 py-2 text-sm font-medium text-[var(--color-accent-foreground)] hover:opacity-90"
        >
          <Plus size={16} /> Nova Sessão
        </button>
      </div>

      <div className="flex gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-1 w-fit">
        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              sort === opt.value
                ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                : "text-[color:var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {!loading && sessions.length === 0 && (
          <p className="py-12 text-center text-sm text-[color:var(--color-text-muted)]">
            Nenhuma sessão registrada ainda. Clique em "Nova Sessão" para começar.
          </p>
        )}
        {sessions.map((s) => (
          <SessionRow key={s.id} session={s} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
