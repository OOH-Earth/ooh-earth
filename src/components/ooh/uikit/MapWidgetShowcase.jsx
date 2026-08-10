import {
  BarChart3,
  X,
  Layers,
  ScanSearch,
  FileDown,
  Key,
  SprayCan,
  Camera,
  Megaphone,
  Columns,
  Map as MapIcon,
  List,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Minus,
} from "lucide-react";

const STATS = [
  { k: "Spots", v: "847", c: "#EDFF00" },
  { k: "Clusters", v: "12", c: "#FF5C00" },
  { k: "Leads", v: "203", c: "#FF5C00" },
  { k: "Verified", v: "644", c: "#39FF14" },
];

const GRID_LAYOUT = [
  { pos: "top-left", mobile: "View toggle", desktop: "View toggle (Flat / Globe)", z: 1000 },
  { pos: "top-right", mobile: "Graffiti · Capture · Report", desktop: "Style · Find · GeoJSON · Keys │ Graffiti · Capture · Report", z: 1000 },
  { pos: "top-center", mobile: "Alert ticker (below buttons)", desktop: "Alert ticker (left-3 → right-3, below buttons)", z: 900 },
  { pos: "left-rail", mobile: "Field tally (closable)", desktop: "Field tally (top-28, left rail)", z: 1000 },
  { pos: "bottom", mobile: "SpecsBar (flat only)", desktop: "SpecsBar (flat only)", z: 900 },
  { pos: "bottom-right", mobile: "Zoom controls", desktop: "Zoom controls (terminal-styled)", z: 1000 },
];

const Z_LAYERS = [
  { z: "1000", items: "View toggle · Action buttons · Field tally" },
  { z: "999", items: "Tooltip portal (TerminalTooltip)" },
  { z: "900", items: "Alert ticker · SpecsBar" },
];

export default function MapWidgetShowcase() {
  return (
    <div className="space-y-5">
      <p className="max-w-2xl font-body text-sm leading-[1.6] text-darkgray">
        Floating overlay system for the field map — every widget is positioned on a strict grid with z-indexed layering. Mobile collapses secondary tools to keep the viewport clear; desktop shows the full rail. Terminal-styled, closable, and persistent via localStorage.
      </p>

      {/* Grid layout reference */}
      <div>
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// Widget grid · position map</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {GRID_LAYOUT.map((w) => (
            <div key={w.pos} className="border border-slate2/40 bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-ozone">{w.pos}</span>
                <span className="font-mono text-[8px] text-dim/60">z-{w.z}</span>
              </div>
              <div className="mt-2 space-y-0.5">
                <div className="font-mono text-[8px] text-dim/60">M: <span className="text-silver/80">{w.mobile}</span></div>
                <div className="font-mono text-[8px] text-dim/60">D: <span className="text-silver/80">{w.desktop}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual mockups */}
      <div>
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// Layout mockup · mobile vs desktop</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {/* Mobile mockup */}
          <div className="border border-slate2/60 bg-void p-2">
            <div className="mb-1 font-mono text-[7px] uppercase tracking-[0.2em] text-flare">Mobile · 373px</div>
            <div className="relative aspect-[9/16] border border-slate2/40 bg-[#0a0a0a] grid-bg">
              <div className="absolute left-1.5 top-1.5 border border-slate2 bg-void/80 px-1 py-0.5 font-mono text-[6px] text-ozone">FLAT</div>
              <div className="absolute right-1.5 top-1.5 flex gap-0.5">
                <span className="border border-flare bg-flare px-1 py-0.5 font-mono text-[6px] font-bold text-void">G</span>
                <span className="border border-ozone bg-ozone px-1 py-0.5 font-mono text-[6px] font-bold text-void">C</span>
                <span className="border border-ozone bg-ozone px-1 py-0.5 font-mono text-[6px] font-bold text-void">R</span>
              </div>
              <div className="absolute bottom-5 left-1.5 border border-slate2/70 bg-void/85 px-1 py-0.5 font-mono text-[6px] text-ozone">▸ Tally 847</div>
              <div className="absolute inset-x-0 bottom-0 border-t border-slate2 bg-[#1a1a1a] px-1 py-0.5 font-mono text-[6px] text-dim">SpecsBar</div>
            </div>
          </div>
          {/* Desktop mockup */}
          <div className="border border-slate2/60 bg-void p-2">
            <div className="mb-1 font-mono text-[7px] uppercase tracking-[0.2em] text-ozone">Desktop · 1024px+</div>
            <div className="relative aspect-[16/9] border border-slate2/40 bg-[#0a0a0a] grid-bg">
              <div className="absolute left-2 top-2 border border-slate2 bg-void/80 px-1.5 py-0.5 font-mono text-[7px] text-ozone">FLAT | GLOBE</div>
              <div className="absolute right-2 top-2 flex items-center gap-0.5">
                <span className="border border-slate2 bg-void/80 px-1 py-0.5 font-mono text-[6px] text-darkgray">Style</span>
                <span className="border border-slate2 bg-void/80 px-1 py-0.5 font-mono text-[6px] text-darkgray">Find</span>
                <span className="border border-slate2 bg-void/80 px-1 py-0.5 font-mono text-[6px] text-darkgray">Keys</span>
                <span className="mx-0.5 h-3 w-px bg-slate2/60" />
                <span className="border border-flare bg-flare px-1 py-0.5 font-mono text-[6px] font-bold text-void">Graffiti</span>
                <span className="border border-ozone bg-ozone px-1 py-0.5 font-mono text-[6px] font-bold text-void">Capture</span>
                <span className="border border-ozone bg-ozone px-1 py-0.5 font-mono text-[6px] font-bold text-void">Report</span>
              </div>
              <div className="absolute left-2 top-14 right-2 border border-slate2/60 bg-void/90 px-1 py-0.5 font-mono text-[5px] text-silver/80">▸ Alert ticker</div>
              <div className="absolute left-2 top-20 w-24 border border-slate2/70 bg-void/85 p-1">
                <div className="font-mono text-[6px] text-dim">● Field tally</div>
                <div className="font-mono text-[8px] font-bold text-ozone">847 spots</div>
              </div>
              <div className="absolute bottom-2 right-2 flex flex-col border border-ozone/15 bg-void/85">
                <span className="border-b border-slate2/60 px-1 py-0.5 font-mono text-[6px] text-darkgray">+</span>
                <span className="px-1 py-0.5 font-mono text-[6px] text-darkgray">−</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 border-t border-slate2 bg-[#1a1a1a] px-2 py-0.5 font-mono text-[6px] text-dim">SpecsBar</div>
            </div>
          </div>
        </div>
      </div>

      {/* Field tally — open state */}
      <div>
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// FieldTallyWidget · open state</div>
        <div className="inline-flex flex-col border border-slate2/70 bg-void/85 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 border-b border-slate2/60 px-2.5 py-1.5">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-ozone animate-pulse" />
              <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-dim">Field tally</span>
            </div>
            <X className="h-3 w-3 text-dim" />
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate2/40">
            {STATS.map((x) => (
              <div key={x.k} className="bg-void px-2.5 py-1.5">
                <div className="font-mono text-[7px] uppercase tracking-[0.2em] text-dim">{x.k}</div>
                <div className="font-mono text-sm font-bold tabular" style={{ color: x.c }}>{x.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Field tally — collapsed */}
      <div>
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// FieldTallyWidget · collapsed state</div>
        <button className="flex items-center gap-1.5 border border-slate2/70 bg-void/85 px-2.5 py-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-ozone backdrop-blur-md">
          <BarChart3 className="h-3 w-3" />
          <span>Tally</span>
          <span className="text-silver tabular">847</span>
        </button>
      </div>

      {/* Action button group */}
      <div>
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// Action button group · desktop layout</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <button className="flex items-center gap-1.5 border border-slate2 bg-void/80 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray backdrop-blur-md">
              <Layers className="h-3.5 w-3.5" /> <span>Dark</span>
            </button>
            <button className="flex items-center gap-1.5 border border-ozone/60 bg-void/80 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone backdrop-blur-md">
              <ScanSearch className="h-3.5 w-3.5" /> <span>Find</span>
            </button>
            <button className="flex items-center gap-1.5 border border-slate2 bg-void/80 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray backdrop-blur-md">
              <FileDown className="h-3.5 w-3.5" /> <span>GeoJSON</span>
            </button>
            <button className="flex items-center gap-1.5 border border-slate2 bg-void/80 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray backdrop-blur-md">
              <Key className="h-3.5 w-3.5" /> <span>Keys</span>
            </button>
          </div>
          <div className="h-8 w-px bg-slate2/60" />
          <button className="flex items-center gap-1.5 border border-flare bg-flare px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void">
            <SprayCan className="h-3.5 w-3.5" /> <span>Graffiti</span>
          </button>
          <button className="flex items-center gap-1.5 border border-ozone bg-ozone px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void">
            <Camera className="h-3.5 w-3.5" /> <span>Capture</span>
          </button>
          <button className="flex items-center gap-1.5 border border-ozone bg-ozone px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void">
            <Megaphone className="h-3.5 w-3.5" /> <span>Report</span>
          </button>
        </div>
      </div>

      {/* Inline mode toggle — Split/Map/List */}
      <div>
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// MapModeToggle · inline buttons</div>
        <div className="flex items-center border border-slate2/60">
          {[
            { label: "Split", icon: Columns, active: true },
            { label: "Map", icon: MapIcon, active: false },
            { label: "List", icon: List, active: false },
          ].map((m) => (
            <div key={m.label} className={`flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] ${m.active ? "bg-ozone text-void" : "text-darkgray"}`}>
              <m.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Collapsible sidebar toggle */}
      <div>
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// SidebarCollapse · terminal edge tab</div>
        <div className="flex items-center gap-4">
          <button className="flex h-16 w-5 items-center justify-center border-y border-r border-slate2 bg-void/90 text-dim backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone">
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim/60">← collapse sidebar (split mode)</span>
          <button className="flex h-16 w-5 items-center justify-center border-y border-r border-slate2 bg-void/90 text-dim backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone">
            <PanelLeftOpen className="h-3.5 w-3.5" />
          </button>
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim/60">← expand sidebar</span>
        </div>
      </div>

      {/* Terminal zoom controls */}
      <div>
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// MapZoomControls · terminal-styled (bottom-right)</div>
        <div className="inline-flex flex-col border border-ozone/15 bg-void/85 backdrop-blur-md">
          <button className="flex items-center justify-center border-b border-slate2/60 p-2 text-darkgray transition-colors hover:bg-ozone/10 hover:text-ozone">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button className="flex items-center justify-center p-2 text-darkgray transition-colors hover:bg-ozone/10 hover:text-ozone">
            <Minus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Z-index reference */}
      <div className="border border-slate2/40 bg-card p-3">
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim">// Z-index layering</div>
        <div className="grid gap-1 sm:grid-cols-3">
          {Z_LAYERS.map((l) => (
            <div key={l.z} className="border border-slate2/40 p-2">
              <div className="font-mono text-[10px] font-bold text-ozone">z-{l.z}</div>
              <div className="font-mono text-[8px] text-dim/80">{l.items}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}