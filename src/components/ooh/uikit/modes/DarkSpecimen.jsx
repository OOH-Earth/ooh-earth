import { Activity } from "lucide-react";

const CORNERS = [
  "left-0 top-0 border-l border-t",
  "right-0 top-0 border-r border-t",
  "left-0 bottom-0 border-l border-b",
  "right-0 bottom-0 border-r border-b",
];

export default function DarkSpecimen() {
  return (
    <div className="dark relative min-h-[320px] overflow-hidden border border-border bg-background p-5 text-foreground">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 80px -10px rgba(0,0,0,0.8)" }} />
      {CORNERS.map((c, i) => (
        <span key={i} className={`pointer-events-none absolute h-4 w-4 border-ozone/60 ${c}`} />
      ))}

      <div className="relative">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-foreground/70">
            <span className="h-1.5 w-1.5 animate-flicker bg-ozone" /> ORBITAL · DEFAULT · ACTIVE
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">:root</span>
        </div>

        <h3 className="mt-3 font-brand text-3xl leading-[0.82] tracking-[-0.02em]">
          ooh<span className="text-ozone">.</span>earth
        </h3>
        <p className="mt-2 max-w-[28ch] font-body text-[11px] leading-[1.55] text-muted-foreground">
          Open-source atlas reclaiming the visual commons. Tactical, field-ready, union-made.
        </p>

        <div className="mt-3 flex items-end gap-3 border border-border bg-card p-3">
          <div>
            <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground">// live spots</div>
            <div className="font-mono text-2xl font-bold tabular text-ozone text-glow-ozone">042</div>
          </div>
          <svg viewBox="0 0 100 30" className="h-7 flex-1" preserveAspectRatio="none">
            <path className="spark-area" d="M0,28 L14,20 L28,24 L42,12 L56,16 L70,8 L84,14 L100,4 L100,30 L0,30 Z" fill="rgba(237,255,0,0.18)" />
            <path className="spark-line" d="M0,28 L14,20 L28,24 L42,12 L56,16 L70,8 L84,14 L100,4" fill="none" stroke="rgb(var(--c-ozone))" strokeWidth="1.6" />
          </svg>
          <span className="flex items-center gap-1 font-mono text-[9px] tabular text-ozone"><Activity className="h-3 w-3" /> +18%</span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-2">
            <button className="bg-ozone px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-void transition-colors hover:bg-flare">Deploy</button>
            <button className="border border-border px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:border-ozone hover:text-ozone">Report</button>
          </div>
          <svg viewBox="0 0 48 48" className="h-12 w-12">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgb(var(--c-ozone))" strokeWidth="0.6" opacity="0.3" />
            <circle cx="24" cy="24" r="13" fill="none" stroke="rgb(var(--c-ozone))" strokeWidth="0.6" opacity="0.3" />
            <circle cx="24" cy="24" r="6" fill="none" stroke="rgb(var(--c-ozone))" strokeWidth="0.6" opacity="0.3" />
            <g className="radar-sweep">
              <path d="M24,24 L24,4 A20,20 0 0,1 38,10 Z" fill="rgba(237,255,0,0.18)" />
              <line x1="24" y1="24" x2="24" y2="4" stroke="rgb(var(--c-ozone))" strokeWidth="0.8" />
            </g>
            <circle cx="24" cy="24" r="1.5" fill="rgb(var(--c-ozone))" />
          </svg>
        </div>

        <div className="mt-3 flex items-center gap-3 border-t border-border pt-2">
          {[["ozone", "bg-ozone"], ["flare", "bg-flare"], ["void", "bg-void border border-border"]].map(([n, c]) => (
            <span key={n} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 ${c}`} />
              <span className="font-mono text-[8px] uppercase text-muted-foreground">{n}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}