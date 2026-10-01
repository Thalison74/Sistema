import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import type { SessionSummary } from "../types";
import { formatDateBr } from "../lib/date";
import { ResultBadge } from "./ui/ResultBadge";

interface Props {
  session: SessionSummary;
  onDelete: (session: SessionSummary) => void;
}

export function SessionRow({ session, onDelete }: Props) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/sessoes/${session.id}`)}
      className="group flex cursor-pointer items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 hover:border-[var(--color-accent)]"
    >
      <div>
        <div className="text-sm font-semibold">{session.name}</div>
        <div className="mt-0.5 text-xs text-[color:var(--color-text-muted)]">
          {formatDateBr(session.session_date)} • {session.session_time} • {session.account_count}{" "}
          {session.account_count === 1 ? "conta" : "contas"}
          {session.has_pending && " • contém pendências"}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ResultBadge cents={session.result_cents} />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(session);
          }}
          className="rounded p-1.5 text-[color:var(--color-text-muted)] opacity-0 transition-opacity hover:bg-[var(--color-negative-bg)] hover:text-[color:var(--color-negative)] group-hover:opacity-100"
          aria-label="Excluir sessão"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
