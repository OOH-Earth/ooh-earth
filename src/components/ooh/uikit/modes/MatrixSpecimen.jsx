export default function MatrixSpecimen() {
  return (
    <div className="matrix relative min-h-[320px] overflow-hidden border border-border bg-background p-0 text-foreground">
      <div className="pointer-events-none absolute inset-0 matrix-rain opacity-40" />
      <div className="pointer-events-none absolute inset-0" style={{ background: "repeating-linear-gradient(0deg,rgba(0,0,0,0.25) 0 1px,transparent 1px 3px)" }} />
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 90px 20px rgba(0,0,0,0.7)" }} />

      <div className="relative flex items-center gap-1.5 border-b border-border bg-black/60 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-[#39FF14]/70" />
        <span className="h-2 w-2 rounded-full bg-[#39FF14]/40" />
        <span className="h-2 w-2 rounded-full bg-[#39FF14]/20" />
        <span className="ml-2 font-mono text-[8px] uppercase tracking-[0.2em] text-foreground/60">root@ooh:~ — reclaim.sh</span>
      </div>

      <div className="relative p-4 font-mono text-[11px] leading-[1.7]">
        <div>
          <span className="text-[#39FF14]">dec@matrix</span>
          <span className="text-foreground/50">:~$</span>{" "}
          <span className="typewriter text-foreground">./reclaim --live --grid</span>
        </div>
        <div className="text-foreground/60">// establishing uplink… <span className="typewriter-caret">▋</span></div>
        <div className="text-foreground/60">042 spots synced · resistance online</div>

        <h3 className="mt-3 glitch font-display text-4xl leading-[0.9] text-[#39FF14]" data-text="WAKE UP.">WAKE UP.</h3>
        <p className="mt-2 max-w-[30ch] text-[11px] leading-[1.6] text-foreground/70">
          The visual commons is not for sale. Map it. Bust it. Own it.
        </p>

        <div className="mt-3 flex gap-2">
          <button className="border border-[#39FF14]/60 bg-[#39FF14]/10 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#39FF14] transition-colors hover:bg-[#39FF14] hover:text-black">Execute</button>
          <button className="border border-[#ff00e5]/50 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#ff00e5] transition-colors hover:bg-[#ff00e5]/15">Abort</button>
        </div>
      </div>
    </div>
  );
}