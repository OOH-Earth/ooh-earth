import { Moon, Sun, Terminal, Bug, PenTool } from "lucide-react";

const MODES = [
  { key: "dark", label: "Dark · Default", icon: Moon, note: ":root" },
  { key: "light", label: "Light · Solar Smoke", icon: Sun, note: ".light" },
  { key: "matrix", label: "Matrix · Terminal", icon: Terminal, note: ".matrix" },
  { key: "beta", label: "BETA · Devtools", icon: Bug, note: ".beta" },
  { key: "crafty", label: "Crafty · Marker", icon: PenTool, note: ".crafty" },
];

const SWATCHES = [
  { name: "ozone", cls: "bg-ozone" },
  { name: "flare", cls: "bg-flare" },
  { name: "void", cls: "bg-void border border-border" },
];

function ModePanel({ m }) {
  const Icon = m.icon;
  return (
    <div className={`${m.key} flex flex-col gap-3 border border-border bg-background p-4 text-foreground`}>
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em] text-foreground/70">
          <Icon className="h-3.5 w-3.5" /> {m.label}
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">{m.note}</span>
      </div>

      <h1 className="font-brand text-2xl leading-[0.85] tracking-[-0.02em] text-foreground">
        ooh<span className="text-ozone">.</span>earth
      </h1>
      <p className="font-body text-[12px] leading-[1.55] text-muted-foreground">
        Open-source atlas reclaiming the visual commons — mapping ad offenses and street-art resistance worldwide.
      </p>

      <div className="flex flex-wrap gap-2">
        <button className="bg-ozone px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-void">Deploy</button>
        <button className="border border-border px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-foreground hover:border-ozone">Report</button>
      </div>

      <div className="border border-border bg-card p-2.5">
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">// field card</span>
        <div className="mt-1 font-display text-sm font-semibold text-foreground">Billboard · 1039 Ploenchit</div>
      </div>

      <div className="flex items-center gap-3">
        {SWATCHES.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 ${s.cls}`} />
            <span className="font-mono text-[8px] uppercase text-muted-foreground">{s.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ThemeModeMatrix() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {MODES.map((m) => <ModePanel key={m.key} m={m} />)}
    </div>
  );
}