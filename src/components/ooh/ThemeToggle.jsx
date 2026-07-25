import { useState, useEffect } from "react";
import { Sun, Moon, Terminal, Bug } from "lucide-react";

const ORDER = ["dark", "light", "matrix", "beta"];

const META = {
  dark: { icon: Moon, label: "Dark" },
  light: { icon: Sun, label: "Light" },
  matrix: { icon: Terminal, label: "Matrix" },
  beta: { icon: Bug, label: "BETA" },
};

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.classList.toggle("matrix", theme === "matrix");
  root.classList.toggle("beta", theme === "beta");
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const stored = localStorage.getItem("ooh-theme");
    const t = ORDER.includes(stored) ? stored : "dark";
    setTheme(t);
    applyTheme(t);
  }, []);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    try {
      localStorage.setItem("ooh-theme", next);
    } catch (e) {}
    applyTheme(next);
  };

  const M = META[theme];

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