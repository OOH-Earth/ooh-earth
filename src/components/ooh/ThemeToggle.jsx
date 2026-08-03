import { useState, useEffect } from "react";
import { Sun, Moon, Terminal, Bug, PenTool, Landmark } from "lucide-react";
import {
  THEME_ORDER, THEME_DEFAULT, applyTheme, fetchEnabledThemes,
  readCachedThemes, writeThemeCache, resolveDefault,
} from "@/lib/themes";

const META = {
  dark: { icon: Moon, label: "Dark" },
  light: { icon: Sun, label: "Light" },
  matrix: { icon: Terminal, label: "Matrix" },
  beta: { icon: Bug, label: "BETA" },
  crafty: { icon: PenTool, label: "Crafty" },
  guild: { icon: Landmark, label: "Guild" },
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState(THEME_DEFAULT);
  const [enabled, setEnabled] = useState(THEME_ORDER);

  useEffect(() => {
    let active = true;
    const stored = localStorage.getItem("ooh-theme");
    const cached = readCachedThemes();
    const initEnabled = cached ? THEME_ORDER.filter((t) => cached.includes(t)) : THEME_ORDER;
    setEnabled(initEnabled);
    const initial = stored && initEnabled.includes(stored) ? stored : resolveDefault(initEnabled);
    setTheme(initial);
    applyTheme(initial);

    fetchEnabledThemes().then((all) => {
      if (!active || !all) return;
      writeThemeCache(all);
      const list = THEME_ORDER.filter((t) => all.includes(t));
      setEnabled(list);
      setTheme((cur) => (list.includes(cur) ? cur : resolveDefault(list)));
    });
    return () => { active = false; };
  }, []);

  const cycle = () => {
    const order = enabled.length ? enabled : THEME_ORDER;
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    try { localStorage.setItem("ooh-theme", next); } catch (e) {}
    applyTheme(next);
  };

  const M = META[theme] || META[THEME_DEFAULT];
  return (
    <button
      onClick={cycle}
      aria-label={`Theme: ${M.label}`}
      className="flex items-center gap-2 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone hover:text-ozone"
    >
      <M.icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{M.label}</span>
    </button>
  );
}