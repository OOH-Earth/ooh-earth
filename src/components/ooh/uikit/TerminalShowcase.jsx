/**
 * Terminal UI kit showcase — used on /kit.
 * Displays the terminal-window aesthetic used across the app: map popups,
 * bottom sheets, data displays, and action surfaces.
 *
 * Dark canvas, grid textures, traffic-light headers, scanline overlays,
 * neon-bordered buttons, and syntax-highlighted code blocks.
 */
export default function TerminalShowcase() {
  return (
    <div className="space-y-4">
      {/* === Full terminal window === */}
      <div className="overflow-hidden border border-ozone/20 bg-[#0a0b0d] crt-scanlines">
        {/* Header */}
        <div className="flex items-center gap-1.5 border-b border-ozone/15 bg-[#080809] px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5555]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FFB86C]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#50FA7B]" />
          <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-dim/60">telemetry.ts</span>
          <span className="ml-auto font-mono text-[8px] uppercase tracking-[0.15em] text-dim/40">BETA · DEVTOOLS</span>
        </div>
        {/* Code section with line numbers */}
        <div className="flex">
          <div className="select-none border-r border-slate2/30 px-2 py-3 text-right font-mono text-[10px] leading-[1.6] text-dim/30">
            01<br />02<br />03<br />04<br />05
          </div>
          <div className="flex-1 px-3 py-3 font-mono text-[10px] leading-[1.6]">
            <div><span className="text-[#bd93f9]">const</span> <span className="text-[#8be9fd]">spots</span> = <span className="text-[#50fa7b]">042</span>;</div>
            <div><span className="text-[#bd93f9]">const</span> <span className="text-[#8be9fd]">resist</span> = <span className="text-[#50fa7b]">"visual commons"</span>;</div>
            <div className="text-[#6272a4]">{"// field sync active"}</div>
            <div><span className="text-[#bd93f9]">log</span>(<span className="text-[#8be9fd]">spots</span> + <span className="text-[#50fa7b]">" reclaimed"</span>);</div>
            <div className="text-[#50fa7b]">{"> fieldStats() // 042 spots · +18%"}</div>
          </div>
        </div>
        {/* Footer with stack + action buttons */}
        <div className="flex items-center justify-between border-t border-ozone/10 px-3 py-2">
          <span className="font-mono text-[8px] text-dim/40">stack: vite · deno · web7</span>
          <div className="flex gap-2">
            <button className="border border-[#50fa7b]/50 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-[#50fa7b] transition-colors hover:bg-[#50fa7b] hover:text-black">
              Deploy
            </button>
            <button className="border border-[#4488ff] bg-[#4488ff]/15 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-[#4488ff] transition-colors hover:bg-[#4488ff] hover:text-black">
              Run →
            </button>
          </div>
        </div>
      </div>

      {/* === Button variants === */}
      <div>
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim/60">// action surfaces</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Execute", color: "#50FA7B", filled: false },
            { label: "Abort", color: "#FF00FF", filled: false },
            { label: "Deploy", color: "#50FA7B", filled: false },
            { label: "Run →", color: "#4488FF", filled: true },
          ].map((btn) => (
            <button
              key={btn.label}
              className="border px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-colors"
              style={{
                borderColor: `${btn.color}60`,
                color: btn.color,
                background: btn.filled ? `${btn.color}15` : "transparent",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = btn.color; e.currentTarget.style.color = "#000"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = btn.filled ? `${btn.color}15` : "transparent"; e.currentTarget.style.color = btn.color; }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* === Map popup specimen === */}
      <div>
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim/60">// map popup · terminal-styled</div>
        <div className="max-w-[240px] border border-ozone/15 bg-[#0a0a0a] crt-scanlines">
          {/* Terminal header */}
          <div className="flex items-center gap-1.5 border-b border-ozone/10 bg-[#080808] px-2.5 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[#FF5555]" />
            <span className="h-2 w-2 rounded-full bg-[#FFB86C]" />
            <span className="h-2 w-2 rounded-full bg-[#50FA7B]" />
            <span className="ml-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-dim/50">billboard.ts</span>
            <span className="ml-auto font-mono text-[6px] uppercase tracking-[0.15em] text-dim/30">DEV</span>
          </div>
          {/* Thumbnail placeholder */}
          <div className="relative flex h-[80px] items-center justify-center grid-bg bg-[#0a0a0a]">
            <span className="font-mono text-[7px] font-bold uppercase tracking-[0.2em] text-ozone/60">// photo</span>
          </div>
          {/* Content */}
          <div className="px-2.5 py-2">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-ozone">Billboard</span>
              <span className="h-1 w-1 rounded-full bg-[#39FF14]" />
              <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim/50">verified</span>
            </div>
            <div className="mt-1 font-mono text-[11px] font-bold text-silver">Billboard · 1039 Phloenchit</div>
            <div className="mt-0.5 font-mono text-[8px] text-dim/50">13.7256, 100.5770</div>
            <div className="mt-2 flex gap-1.5">
              <span className="border border-flare/50 px-2 py-0.5 font-mono text-[7px] font-bold uppercase tracking-[0.15em] text-flare">Directions ↗</span>
              <span className="border border-ozone/50 px-2 py-0.5 font-mono text-[7px] font-bold uppercase tracking-[0.15em] text-ozone">Page ↗</span>
            </div>
          </div>
        </div>
      </div>

      {/* === Data display specimen === */}
      <div>
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-dim/60">// field tally · compact</div>
        <div className="grid grid-cols-4 gap-px border border-ozone/15 bg-slate2/30">
          {[
            { k: "spots", v: "925", c: "#EDFF00" },
            { k: "clusters", v: "06", c: "#FF5C00" },
            { k: "leads", v: "155", c: "#FF5C00" },
            { k: "verified", v: "769", c: "#39FF14" },
          ].map((s) => (
            <div key={s.k} className="bg-[#0a0a0a] px-2 py-2 text-center">
              <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-dim/50">{s.k}</div>
              <div className="mt-0.5 font-mono text-[14px] font-bold tabular-nums" style={{ color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}