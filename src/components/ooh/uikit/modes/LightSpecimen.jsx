export default function LightSpecimen() {
  return (
    <div className="light relative min-h-[320px] overflow-hidden border border-border bg-background p-6 text-foreground">
      <div className="flex items-center justify-between border-b border-foreground/15 pb-2">
        <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-foreground/60">№ 07 · SOLAR SMOKE</span>
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">.light</span>
      </div>

      <div className="mt-4">
        <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-flare">— A field journal</span>
        <h3 className="mt-1 font-display text-[2.1rem] font-black leading-[0.92] tracking-[-0.03em]">
          Reclaim the<br />visual commons.
        </h3>
      </div>

      <div className="mt-4 flex gap-3 border-l-2 border-flare pl-3">
        <p className="font-body text-[12px] leading-[1.6] text-foreground/75">
          An open-source atlas mapping advertising offenses and the street-art resistance rewriting them — one city at a time.
        </p>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button className="bg-foreground px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-85">Read the brief</button>
        <button className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-foreground underline decoration-flare decoration-2 underline-offset-4 transition-opacity hover:opacity-70">Support →</button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-foreground/15 pt-3">
        {[["Smoke", "#F1F1F1"], ["Flare", "#FF5C00"], ["Ink", "#0A0A0A"]].map(([n, h]) => (
          <div key={n} className="flex flex-col gap-1">
            <span className="h-6 w-full border border-foreground/10" style={{ background: h }} />
            <span className="font-mono text-[7px] uppercase tracking-[0.15em] text-foreground/50">{n}</span>
            <span className="font-mono text-[7px] text-muted-foreground">{h}</span>
          </div>
        ))}
      </div>
    </div>
  );
}