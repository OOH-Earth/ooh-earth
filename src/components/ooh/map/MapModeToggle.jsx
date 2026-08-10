import { useState } from "react";
import { Columns, Map as MapIcon, List, ChevronDown } from "lucide-react";

// Collapsible Split/Map/List mode selector.
// Desktop: compact dropdown showing current mode, expands on click.
// Mobile: icon-only button, same dropdown behavior.
const MODES = [
  { value: "split", label: "Split", icon: Columns },
  { value: "map", label: "Map", icon: MapIcon },
  { value: "list", label: "List", icon: List },
];

export default function MapModeToggle({ mode, setMode }) {
  const [open, setOpen] = useState(false);
  const cur = MODES.find((m) => m.value === mode) || MODES[0];
  const CurIcon = cur.icon;

  return (
    <div className="relative" data-tour="layout">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Layout mode: ${cur.label}`}
        className="flex items-center gap-1.5 border border-slate2/60 px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-silver transition-colors hover:border-ozone"
      >
        <CurIcon className="h-3.5 w-3.5 text-ozone" />
        <span className="hidden sm:inline">{cur.label}</span>
        <ChevronDown className={`h-3 w-3 text-dim transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[1100]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-[1200] mt-1 min-w-[120px] border border-slate2 bg-void/95 py-1 backdrop-blur-md">
            {MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.value}
                  onClick={() => { setMode(m.value); setOpen(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors ${m.value === mode ? "text-ozone" : "text-darkgray hover:text-silver"}`}
                >
                  <Icon className="h-3 w-3" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}