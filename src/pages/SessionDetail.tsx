import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "../lib/tauri";
import type { Account, SessionDetail as SessionDetailType } from "../types";
import { MoneyInput } from "../components/ui/MoneyInput";
import { ResultBadge } from "../components/ui/ResultBadge";
import { useConfirm } from "../hooks/useConfirm";
import { useToast } from "../hooks/useToast";

const ADVANCE_CLASS = "advance-field";

function focusNext(current: HTMLElement) {
  const fields = Array.from(document.querySelectorAll<HTMLElement>(`.${ADVANCE_CLASS}`));
  const index = fields.indexOf(current);
  const next = fields[index + 1];
  next?.focus();
}

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();

  const [detail, setDetail] = useState<SessionDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const sessionSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = useCallback(() => {
    api
      .sessionGetDetail(sessionId)
      .then(setDetail)
      .catch((err) => {
        toast(errorMessage(err), "error");
        navigate("/sessoes");
      })
      .finally(() => setLoading(false));
  }, [sessionId, navigate, toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !detail) {
    return <p className="text-sm text-[color:var(--color-text-muted)]">Carregando...</p>;
  }

  const updateSessionField = (field: "name" | "session_date" | "session_time" | "notes", value: string) => {
    setDetail((prev) => (prev ? { ...prev, [field]: value } : prev));
    clearTimeout(sessionSaveTimer.current);
    sessionSaveTimer.current = setTimeout(async () => {
      try {
        await api.sessionUpdate({
          id: sessionId,
          name: field === "name" ? value : detail.name,
          session_date: field === "session_date" ? value : detail.session_date,
          session_time: field === "session_time" ? value : detail.session_time,
          notes: field === "notes" ? value : detail.notes,
        });
      } catch (err) {
        toast(errorMessage(err), "error");
      }
    }, 400);
  };

  const recomputeTotals = (accounts: Account[]) => {
    const profit_cents = accounts.filter((a) => (a.result_cents ?? 0) > 0).reduce((s, a) => s + (a.result_cents ?? 0), 0);
    const loss_cents = accounts.filter((a) => (a.result_cents ?? 0) < 0).reduce((s, a) => s + (a.result_cents ?? 0), 0);
    const result_cents = accounts.reduce((s, a) => s + (a.result_cents ?? 0), 0);
    const has_pending = accounts.some((a) => a.final_balance_cents === null);
    return { profit_cents, loss_cents, result_cents, has_pending };
  };

  const updateAccountLocal = (accountId: number, patch: Partial<Account>) => {
    setDetail((prev) => {
      if (!prev) return prev;
      const accounts = prev.accounts.map((a) => {
        if (a.id !== accountId) return a;
        const next = { ...a, ...patch };
        next.result_cents = next.final_balance_cents === null ? null : next.final_balance_cents - next.initial_balance_cents;
        return next;
      });
      return { ...prev, accounts, ...recomputeTotals(accounts) };
    });
  };

  const persistAccount = (account: Account) => {
    clearTimeout(saveTimers.current[account.id]);
    saveTimers.current[account.id] = setTimeout(async () => {
      try {
        await api.accountUpdate({
          id: account.id,
          name: account.name,
          initial_balance_cents: account.initial_balance_cents,
          final_balance_cents: account.final_balance_cents,
          final_balance_is_pending: account.final_balance_cents === null,
          notes: account.notes,
        });
      } catch (err) {
        toast(errorMessage(err), "error");
      }
    }, 350);
  };

  const handleAddAccount = async () => {
    try {
      const account = await api.accountAdd({ session_id: sessionId });
      setDetail((prev) => (prev ? { ...prev, accounts: [...prev.accounts, account], has_pending: true } : prev));
      requestAnimationFrame(() => {
        const inputs = document.querySelectorAll<HTMLElement>(`.${ADVANCE_CLASS}`);
        (inputs[inputs.length - 3] as HTMLElement | undefined)?.focus();
      });
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    const ok = await confirm({
      title: "Excluir conta",
      message: `Remover "${account.name}" desta sessão?`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.accountDelete(account.id);
      setDetail((prev) => {
        if (!prev) return prev;
        const accounts = prev.accounts.filter((a) => a.id !== account.id);
        return { ...prev, accounts, ...recomputeTotals(accounts) };
      });
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-xs font-medium text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)]"
      >
        <ArrowLeft size={14} /> Voltar
      </button>

      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs text-[color:var(--color-text-muted)]">Nome da sessão</label>
            <input
              value={detail.name}
              onChange={(e) => updateSessionField("name", e.target.value)}
              className="mt-1 w-full rounded border border-[var(--color-border)] bg-transparent px-2 py-1.5 text-sm font-medium outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="text-xs text-[color:var(--color-text-muted)]">Data</label>
            <input
              type="date"
              value={detail.session_date}
              onChange={(e) => updateSessionField("session_date", e.target.value)}
              className="mt-1 w-full rounded border border-[var(--color-border)] bg-transparent px-2 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="text-xs text-[color:var(--color-text-muted)]">Horário</label>
            <input
              type="time"
              value={detail.session_time}
              onChange={(e) => updateSessionField("session_time", e.target.value)}
              className="mt-1 w-full rounded border border-[var(--color-border)] bg-transparent px-2 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs text-[color:var(--color-text-muted)]">Observação (opcional)</label>
          <input
            value={detail.notes ?? ""}
            onChange={(e) => updateSessionField("notes", e.target.value)}
            placeholder="Nenhuma observação"
            className="mt-1 w-full rounded border border-[var(--color-border)] bg-transparent px-2 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <h2 className="text-sm font-semibold">Contas</h2>
          <button
            onClick={handleAddAccount}
            className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-surface-alt)]"
          >
            <Plus size={14} /> Adicionar Conta
          </button>
        </div>

        {detail.accounts.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[color:var(--color-text-muted)]">
            Nenhuma conta ainda. Clique em "Adicionar Conta" para começar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-xs text-[color:var(--color-text-muted)]">
                  <th className="px-4 py-2 font-medium">Conta</th>
                  <th className="px-4 py-2 font-medium">Saldo Inicial</th>
                  <th className="px-4 py-2 font-medium">Saldo Final</th>
                  <th className="px-4 py-2 font-medium">Resultado</th>
                  <th className="w-10 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {detail.accounts.map((account) => (
                  <tr key={account.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-2">
                      <input
                        className={`${ADVANCE_CLASS} w-full min-w-[120px] rounded border border-transparent bg-transparent px-1.5 py-1 outline-none hover:border-[var(--color-border)] focus:border-[var(--color-accent)]`}
                        value={account.name}
                        onChange={(e) => updateAccountLocal(account.id, { name: e.target.value })}
                        onBlur={() => persistAccount(detail.accounts.find((a) => a.id === account.id)!)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            focusNext(e.currentTarget);
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <MoneyInput
                        inputClassName={ADVANCE_CLASS}
                        cents={account.initial_balance_cents}
                        onChange={(cents) => {
                          updateAccountLocal(account.id, { initial_balance_cents: cents ?? 0 });
                          const updated = { ...account, initial_balance_cents: cents ?? 0 };
                          persistAccount(updated);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            focusNext(e.currentTarget);
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <MoneyInput
                        inputClassName={ADVANCE_CLASS}
                        cents={account.final_balance_cents}
                        allowEmpty
                        placeholder="Pendente"
                        onChange={(cents) => {
                          updateAccountLocal(account.id, { final_balance_cents: cents });
                          const updated = { ...account, final_balance_cents: cents };
                          persistAccount(updated);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            focusNext(e.currentTarget);
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <ResultBadge cents={account.result_cents} size="sm" />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => handleDeleteAccount(account)}
                        className="rounded p-1.5 text-[color:var(--color-text-muted)] hover:bg-[var(--color-negative-bg)] hover:text-[color:var(--color-negative)]"
                        aria-label="Excluir conta"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3">
          <div className="flex gap-4 text-xs text-[color:var(--color-text-muted)]">
            <span>
              Lucros da sessão: <ResultBadge cents={detail.profit_cents} size="sm" />
            </span>
            <span>
              Perdas da sessão: <ResultBadge cents={detail.loss_cents} size="sm" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">RESULTADO DA SESSÃO:</span>
            <ResultBadge cents={detail.result_cents} size="lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
