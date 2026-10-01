import { useEffect, useState, type ReactNode } from "react";
import { openPath } from "@tauri-apps/plugin-opener";
import { FolderOpen, Download, Upload } from "lucide-react";
import { api, errorMessage } from "../lib/tauri";
import type { AppInfo, ThemeSetting } from "../types";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../hooks/useToast";
import { runBackup, runRestore } from "../lib/backupActions";

const themeOptions: { value: ThemeSetting; label: string }[] = [
  { value: "light", label: "Tema claro" },
  { value: "dark", label: "Tema escuro" },
  { value: "system", label: "Seguir sistema" },
];

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    api.appGetInfo().then(setInfo).catch((err) => toast(errorMessage(err), "error"));
  }, [toast]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Configurações</h1>
      </div>

      <Section title="Aparência">
        <div className="flex gap-2">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                theme === opt.value
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                  : "border-[var(--color-border)] text-[color:var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Dados">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => runBackup(toast)}
            className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-surface-alt)]"
          >
            <Download size={15} /> Criar Backup
          </button>
          <button
            onClick={() => runRestore(toast, () => window.location.reload())}
            className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-surface-alt)]"
          >
            <Upload size={15} /> Restaurar Backup
          </button>
          <button
            onClick={() => info && openPath(info.data_dir).catch((err) => toast(errorMessage(err), "error"))}
            className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-surface-alt)]"
          >
            <FolderOpen size={15} /> Abrir Pasta dos Dados
          </button>
        </div>
      </Section>

      <Section title="Sobre">
        <div className="space-y-1 text-sm">
          <div className="font-medium">{info?.name ?? "Gerenciador de Lucros"}</div>
          <div className="text-[color:var(--color-text-muted)]">Versão {info?.version ?? "—"}</div>
          <div className="text-[color:var(--color-text-muted)]">
            Aplicativo local e offline. Seus dados ficam armazenados apenas neste computador.
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}
