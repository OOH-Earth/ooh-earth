export default function BetaSpecimen() {
  return (
    <div className="beta relative min-h-[320px] overflow-hidden border border-border bg-background p-0 text-foreground">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(rgba(78,201,176,0.10) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      <div className="relative flex items-center gap-2 border-b border-border bg-black/40 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-[#f44747]" />
        <span className="font-mono text-[9px] text-[#4ec9b0]">telemetry.ts</span>
        <span className="ml-auto font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
          BETA · devtools
        </span>
      </div>

      <div className="relative flex font-mono text-[11px] leading-[1.7]">
        <div className="select-none border-r border-border bg-black/20 px-2 py-3 text-right text-[#5b6170]">
          {['01', '02', '03', '04', '05'].map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>
        <div className="px-3 py-3">
          <div>
            <span className="text-[#c678dd]">const</span>{' '}
            <span className="text-[#61afef]">spots</span> <span className="text-[#56b6c2]">=</span>{' '}
            <span className="text-[#d19a66]">042</span>;
          </div>
          <div>
            <span className="text-[#c678dd]">const</span>{' '}
            <span className="text-[#61afef]">resist</span> <span className="text-[#56b6c2]">=</span>{' '}
            <span className="text-[#98c379]">"visual commons"</span>;
          </div>
          <div className="text-[#7f848e]">// map it · bust it · own it</div>
          <div>
            <span className="text-[#61afef]">log</span>(<span className="text-[#e5c07b]">sync</span>
            (spots)) <span className="text-[#7f848e]">// → online</span>
          </div>
          <div className="text-[#7f848e]">↳ resistance online</div>
        </div>
      </div>

      <div className="relative border-t border-border bg-black/40 px-3 py-2 font-mono text-[10px]">
        <span className="text-[#4ec9b0]">›</span>{' '}
        <span className="text-muted-foreground">fieldStats()</span>{' '}
        <span className="text-[#98c379]">// 042 spots · +18%</span>
      </div>

      <div className="relative flex items-center justify-between border-t border-border px-3 py-2.5">
        <span className="font-mono text-[9px] text-muted-foreground">
          stack: vite · deno · web7
        </span>
        <div className="flex gap-2">
          <button className="border border-[#4ec9b0]/50 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#4ec9b0] transition-colors hover:bg-[#4ec9b0]/15">
            Deploy
          </button>
          <button className="bg-[#61afef] px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-85">
            Run ▸
          </button>
        </div>
      </div>
    </div>
  );
}
