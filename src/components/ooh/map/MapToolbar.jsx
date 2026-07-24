import { Columns, Map as MapIcon, List } from "lucide-react";

export const TYPES = [
  { value: "all", label: "All" },
  { value: "billboard", label: "Billboard" },
  { value: "digital", label: "Digital" },
  { value: "painted", label: "Painted" },
  { value: "projection", label: "Projection" },
  { value: "sticker", label: "Sticker" },
  { value: "mural", label: "Mural" },
  { value: "other", label: "Other" },
];

const MODES = [
  { value: "split", label: "Split", icon: Columns },
  { value: "map", label: "Map", icon: MapIcon },
  { value: "list", label: "List", icon: List },
];

export default function MapToolbar({ typeFilter, setTypeFilter, mode, setMode, count, live }) {
  return (
    <div className="shrink-0 border-b border-slate2/60 bg-void/90 backdrop-blur-md">
      <div className="flex items-center gap-3 px-5 py-2.5 md:px-8">
        <span className="font-display text-sm font-black uppercase tracking-[0.25em] text-silver">OOH MAP</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
          <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-ozone animate-flicker" : "bg-dim"}`} />
          {live ? "live" : "snapshot"} · {count}
        </span>
        <span className="hidden h-4 w-px bg-slate2 lg:block" />
        <div data-tour="filters" className="hidden flex-1 items-center gap-1.5 overflow-x-auto lg:flex">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`shrink-0 border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${
                typeFilter === t.value ? "border-ozone bg-ozone text-void" : "border-slate2/60 text-darkgray hover:border-ozone hover:text-ozone"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div data-tour="layout" className="ml-auto flex items-center border border-slate2/60">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                title={m.label}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 transition-colors ${mode === m.value ? "bg-ozone text-void" : "text-darkgray hover:text-ozone"}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden font-mono text-[9px] font-bold uppercase tracking-[0.15em] sm:inline">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto px-5 pb-2.5 lg:hidden">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value)}
            className={`shrink-0 border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] ${
              typeFilter === t.value ? "border-ozone bg-ozone text-void" : "border-slate2/60 text-darkgray"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}