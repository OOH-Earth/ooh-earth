import { useState, useEffect } from "react";
import { Type } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const PRESETS = [
  { label: "A−", pct: 90, name: "Small" },
  { label: "A", pct: 100, name: "Default" },
  { label: "A+", pct: 115, name: "Large" },
  { label: "A++", pct: 130, name: "X-Large" },
];
const KEY = "ooh-type-scale";

export default function TypeEnhancer() {
  const [pct, setPct] = useState(100);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(KEY));
      if (saved) {
        setPct(saved);
        document.documentElement.style.fontSize = `${saved}%`;
      }
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const apply = (v) => {
    setPct(v);
    document.documentElement.style.fontSize = `${v}%`;
    try {
      localStorage.setItem(KEY, String(v));
    } catch {
      /* localStorage unavailable */
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Adjust text size"
          title="Text size"
          className="flex h-8 w-8 items-center justify-center border border-slate2 text-silver transition-colors hover:border-ozone hover:text-ozone"
        >
          <Type className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-44 border border-slate2 bg-void p-2">
        <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-dim">Text size · WCAG</div>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.pct}
              onClick={() => apply(p.pct)}
              className={`flex flex-col items-center gap-0.5 border px-2 py-1.5 transition-colors ${
                pct === p.pct
                  ? "border-ozone bg-ozone text-void"
                  : "border-slate2 text-silver hover:border-ozone hover:text-ozone"
              }`}
            >
              <span className="font-mono text-[11px] font-bold">{p.label}</span>
              <span className="font-mono text-[7px] uppercase tracking-[0.2em] opacity-70">{p.name}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => apply(100)}
          className="mt-2 w-full border border-slate2 py-1 font-mono text-[8px] uppercase tracking-[0.25em] text-dim transition-colors hover:text-ozone"
        >
          Reset
        </button>
      </PopoverContent>
    </Popover>
  );
}