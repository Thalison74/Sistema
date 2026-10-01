import { NavLink } from "react-router-dom";
import { LayoutDashboard, ListChecks, History, Settings } from "lucide-react";
import { cn } from "../../lib/cn";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/sessoes", label: "Sessões", icon: ListChecks, end: false },
  { to: "/historico", label: "Histórico", icon: History, end: false },
  { to: "/configuracoes", label: "Configurações", icon: Settings, end: false },
];

export function Sidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-[var(--color-accent)] text-sm font-bold text-[var(--color-accent-foreground)]">
          GL
        </div>
        <div className="text-sm font-semibold leading-tight">Gerenciador de Lucros</div>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                  : "text-[color:var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[color:var(--color-text)]",
              )
            }
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
