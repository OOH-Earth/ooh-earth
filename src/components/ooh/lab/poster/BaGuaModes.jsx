const TRIGRAMS = [
  { name: "Fire", pinyin: "Li", lines: [1, 0, 1] },
  { name: "Earth", pinyin: "Kun", lines: [0, 0, 0] },
  { name: "Lake", pinyin: "Dui", lines: [1, 1, 0] },
  { name: "Heaven", pinyin: "Qian", lines: [1, 1, 1] },
  { name: "Water", pinyin: "Kan", lines: [0, 1, 0] },
  { name: "Wind", pinyin: "Xun", lines: [0, 1, 1] },
  { name: "Mountain", pinyin: "Gen", lines: [0, 0, 1] },
  { name: "Thunder", pinyin: "Zhen", lines: [1, 0, 0] },
];

function Trigram({ lines, x, y }) {
  const rev = [...lines].reverse(); // top line first
  const lh = 3.5, gap = 4, w = 26, half = w / 2;
  const top = y - (rev.length * lh + (rev.length - 1) * gap) / 2;
  return rev.map((v, i) => {
    const ly = top + i * (lh + gap);
    if (v) return <rect key={i} x={x - half} y={ly} width={w} height={lh} fill="#C5A059" />;
    return <g key={i}><rect x={x - half} y={ly} width={w * 0.42} height={lh} fill="#C5A059" /><rect x={x + w * 0.08} y={ly} width={w * 0.42} height={lh} fill="#C5A059" /></g>;
  });
}

export default function BaGuaModes() {
  const cx = 200, cy = 200, R = 150, octR = 95;
  const oct = Array.from({ length: 8 }).map((_, i) => {
    const a = (-90 + i * 45) * Math.PI / 180;
    return [cx + Math.cos(a) * octR, cy + Math.sin(a) * octR];
  });
  const octPath = oct.map((p) => p.join(",")).join(" ");
  return (
    <section className="border border-slate2 bg-card p-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">8 Ba Gua modes</div>
      <p className="mt-2 max-w-xl font-mono text-[11px] leading-relaxed text-silver/50">The context ring selects the ecosystem layer. Eight trigrams, eight modes — the city read through ancient systems.</p>
      <div className="mt-4 flex justify-center">
        <svg viewBox="0 0 400 400" className="w-full max-w-[360px]" role="img" aria-label="Ba Gua octagon of eight trigram modes">
          <polygon points={octPath} fill="none" stroke="#6B5533" strokeWidth="2" />
          {oct.map((p, i) => <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="#3E3220" strokeWidth="1" opacity="0.6" />)}
          <circle cx={cx} cy={cy} r="34" fill="#1a1612" stroke="#8c6f4a" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="22" fill="none" stroke="#8c6f4a" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="10" fill="#3E3220" stroke="#C5A059" strokeWidth="1" />
          {TRIGRAMS.map((t, i) => {
            const a = (-90 + i * 45) * Math.PI / 180;
            const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
            return (
              <g key={t.name}>
                <Trigram lines={t.lines} x={x} y={y - 8} />
                <text x={x} y={y + 18} textAnchor="middle" fontSize="13" fontWeight="700" fill="#D1C7B7" fontFamily="Inter Tight, sans-serif">{t.name.toUpperCase()}</text>
                <text x={x} y={y + 32} textAnchor="middle" fontSize="10" fill="#a39b8f" fontFamily="Inter Tight, sans-serif">{t.pinyin}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}