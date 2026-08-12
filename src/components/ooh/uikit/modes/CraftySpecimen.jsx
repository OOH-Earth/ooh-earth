export default function CraftySpecimen() {
  return (
    <div className="crafty relative min-h-[320px] overflow-hidden border border-border bg-background p-6 text-foreground">
      <span className="tape absolute -left-3 top-4 h-6 w-20 -rotate-[8deg]" />
      <span className="tape absolute -right-2 top-6 h-5 w-16 rotate-[6deg]" />

      <div className="flex items-center justify-between border-b border-dashed border-border pb-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          ✦ crafty · marker
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
          .crafty
        </span>
      </div>

      <div className="mt-4 -rotate-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-flare">
          — hand-made
        </span>
        <h3 className="mt-1 font-display text-[2.4rem] leading-[0.9]">
          stay <span className="highlighter">loud.</span>
        </h3>
        <svg viewBox="0 0 200 12" className="mt-1 h-3 w-44" fill="none">
          <path
            className="draw-stroke"
            d="M2,8 C30,2 60,10 90,6 C120,2 160,10 198,5"
            stroke="rgb(var(--c-ozone))"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <p className="mt-4 max-w-[30ch] font-body text-[12px] leading-[1.55] text-foreground/80">
        Open-source atlas of ad offenses + the resistance rewriting them. Stick it, stamp it, ship
        it.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button className="-rotate-1 border-2 border-foreground bg-ozone px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-void transition-transform hover:rotate-0 hover:scale-105">
          Grab the kit
        </button>
        <button className="rotate-1 border-2 border-dashed border-border px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-foreground transition-transform hover:rotate-0 hover:scale-105">
          Donate
        </button>
      </div>

      <div className="mt-5 inline-block -rotate-3 border-2 border-flare px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-flare">
        ★ union-made ★
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-dashed border-border pt-3">
        {[
          ['ozone', 'bg-ozone'],
          ['flare', 'bg-flare'],
          ['ink', 'bg-foreground'],
        ].map(([n, c]) => (
          <span key={n} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rotate-3 ${c}`} />
            <span className="font-mono text-[8px] uppercase text-muted-foreground">{n}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
