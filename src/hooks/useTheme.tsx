import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/tauri";
import type { ThemeSetting } from "../types";

interface ThemeContextValue {
  theme: ThemeSetting;
  setTheme: (theme: ThemeSetting) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyEffectiveTheme(theme: ThemeSetting) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const effective = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  document.documentElement.setAttribute("data-theme", effective);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeSetting>("system");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .settingsGetAll()
      .then((settings) => {
        const stored = (settings.theme as ThemeSetting) ?? "system";
        setThemeState(stored);
        applyEffectiveTheme(stored);
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyEffectiveTheme("system");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme]);

  const setTheme = (next: ThemeSetting) => {
    setThemeState(next);
    applyEffectiveTheme(next);
    void api.settingsSet("theme", next);
  };

  if (!loaded) return null;

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
