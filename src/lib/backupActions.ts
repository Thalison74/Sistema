import { save, open, ask } from "@tauri-apps/plugin-dialog";
import { api, errorMessage } from "./tauri";
import { todayIsoDate } from "./date";

type Toast = (message: string, tone?: "success" | "error") => void;

export async function runBackup(toast: Toast) {
  try {
    const destPath = await save({
      title: "Salvar backup",
      defaultPath: `gerenciador-de-lucros-backup-${todayIsoDate()}.db`,
      filters: [{ name: "Backup do Gerenciador de Lucros", extensions: ["db"] }],
    });
    if (!destPath) return;
    await api.backupCreate(destPath);
    toast("Backup criado com sucesso.");
  } catch (err) {
    toast(errorMessage(err), "error");
  }
}

export async function runRestore(toast: Toast, onRestored: () => void) {
  try {
    const srcPath = await open({
      title: "Selecionar backup",
      multiple: false,
      filters: [{ name: "Backup do Gerenciador de Lucros", extensions: ["db"] }],
    });
    if (!srcPath || Array.isArray(srcPath)) return;

    const confirmed = await ask(
      "A restauração substituirá os dados atuais. Deseja continuar?",
      { title: "Restaurar backup", kind: "warning" },
    );
    if (!confirmed) return;

    await api.backupRestore(srcPath);
    toast("Backup restaurado com sucesso.");
    onRestored();
  } catch (err) {
    toast(errorMessage(err), "error");
  }
}
