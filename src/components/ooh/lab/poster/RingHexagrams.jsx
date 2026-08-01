const LINES = [1, 0, 1, 1, 0, 0]; // bottom → top · 101100b = 44 · Gou / Encounter

function RingDisc({ yang, n }) {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16" role="img" aria-label={`Ring ${n} ${yang ? "yang" : "yin"}`}>
      <defs>
        <radialGradient id={`rd${n}`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#D4AF37" /><stop offset="100%" stopColor="#6B4F32" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill={`url(#rd${n})`} stroke="#3E3220" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="20" fill="none" stroke="#8B6914" strokeWidth="1" opacity="0.6" />
      {yang
        ? <rect x="16" y="29" width="32" height="6" fill="#1a1410" />
        : <><rect x="16" y="29" width="13" height="6" fill="#1a1410" /><rect x="35" y="29" width="13" height="6" fill="#1a1410" /></>}
    </svg>
  );
}

export default function RingHexagrams() {
  return (
    <section className="border border-slate2 bg-card p-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">6 rings = 64 hexagram states</div>
      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="flex flex-wrap justify-center gap-2">
          {LINES.map((v, i) => <RingDisc key={i} yang={!!v} n={i + 1} />)}
        </div>
        <div className="flex gap-2 font-mono text-[11px] text-silver/60">
          {LINES.map((v, i) => <span key={i} className="w-16 text-center">{v}</span>)}
        </div>
        <div className="mt-1 border border-ozone/40 bg-ozone/5 px-4 py-2 text-center">
          <div className="font-mono text-[12px] uppercase tracking-[0.15em] text-ozone">= Hexagram 44 · Gou / Encounter</div>
          <div className="mt-0.5 font-mono text-[10px] text-silver/55">Binary | 101100b | Decimal 44</div>
        </div>
      </div>
      <p className="mt-4 max-w-2xl font-mono text-[11px] leading-relaxed text-silver/50">Each ring is set to yin (0) or yang (1). The six lines, read Ring 1 → Ring 6, form one of 64 hexagrams — mapped to protocols, modes, locations and network states.</p>
    </section>
  );
}