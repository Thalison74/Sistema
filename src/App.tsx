import { useEffect } from "react";
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Sessions } from "./pages/Sessions";
import { SessionDetail } from "./pages/SessionDetail";
import { History } from "./pages/History";
import { SettingsPage } from "./pages/Settings";
import { ThemeProvider } from "./hooks/useTheme";
import { ToastProvider, useToast } from "./hooks/useToast";
import { ConfirmProvider } from "./hooks/useConfirm";
import { createSessionAndNavigate } from "./lib/sessionActions";
import { runBackup } from "./lib/backupActions";

function GlobalShortcuts() {
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        createSessionAndNavigate(navigate, toast);
      } else if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        runBackup(toast);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, toast]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <GlobalShortcuts />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sessoes" element={<Sessions />} />
          <Route path="/sessoes/:id" element={<SessionDetail />} />
          <Route path="/historico" element={<History />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
