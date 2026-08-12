const FACES = [
  {
    id: 'A',
    title: 'Face A — Protocol',
    desc: 'OOH Earth logo at center, surrounded by 64 hexagrams. Genesis ID & block height.',
    kind: 'protocol',
  },
  {
    id: 'B',
    title: 'Face B — The City',
    desc: 'City grid as circuitry. Murals, billboards & nodes connected as a living network.',
    kind: 'city',
  },
  {
    id: 'C',
    title: 'Face C — The World',
    desc: 'Earth as a network, not borders. Communities connected across cultures.',
    kind: 'world',
  },
  {
    id: 'R',
    title: 'Reverse — I Ching Wheel',
    desc: '64-state wheel. Not for divination, but for navigation, creation & protocol.',
    kind: 'wheel',
  },
];
const VERBS = ['MOVE', 'MAP', 'MINT', 'BUILD', 'DISCOVER', 'SIGN', 'VERIFY', 'CREATE'];
const SPECS = [
  ['Diameter', '45mm'],
  ['Thickness', '6mm'],
  ['Weight', '62g'],
  ['Material', 'Brass / Antique Gold'],
  ['Process', 'CNC + Hand Polished + Laser Engrave'],
  ['Edition', 'Limited · Numbered'],
];

function CoinDisc({ kind }) {
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28" role="img" aria-label={`Coin ${kind}`}>
      <defs>
        <radialGradient id={`coin${kind}`} cx="38%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#E8C879" />
          <stop offset="45%" stopColor="#B8860B" />
          <stop offset="100%" stopColor="#5A430A" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill={`url(#coin${kind})`} stroke="#3E3220" strokeWidth="2" />
      <circle cx="60" cy="60" r="48" fill="none" stroke="#7A5C0E" strokeWidth="1" opacity="0.6" />
      {kind === 'protocol' && (
        <>
          <text
            x="60"
            y="50"
            textAnchor="middle"
            fontSize="16"
            fontWeight="800"
            fill="#3E2A08"
            fontFamily="Inter Tight, sans-serif"
          >
            OOH
          </text>
          <text
            x="60"
            y="63"
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            fill="#3E2A08"
            letterSpacing="1"
            fontFamily="Inter Tight, sans-serif"
          >
            EARTH
          </text>
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={60 + Math.cos(a) * 44}
                y1={60 + Math.sin(a) * 44}
                x2={60 + Math.cos(a) * 48}
                y2={60 + Math.sin(a) * 48}
                stroke="#3E2A08"
                strokeWidth="1"
                opacity="0.5"
              />
            );
          })}
        </>
      )}
      {kind === 'city' && (
        <>
          <g stroke="#3E2A08" strokeWidth="1.5" fill="none" opacity="0.7">
            <path d="M30 40 L60 30 L90 40 L90 80 L60 90 L30 80 Z" />
            <path d="M30 40 L60 50 L90 40" />
            <path d="M30 80 L60 70 L90 80" />
            <path d="M60 50 L60 70" />
          </g>
          {[
            [40, 52],
            [70, 48],
            [55, 68],
            [78, 72],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2" fill="#E8C879" />
          ))}
        </>
      )}
      {kind === 'world' && (
        <>
          <circle cx="60" cy="60" r="26" fill="none" stroke="#3E2A08" strokeWidth="1.5" />
          <ellipse cx="60" cy="60" rx="26" ry="10" fill="none" stroke="#3E2A08" strokeWidth="1" />
          <ellipse cx="60" cy="60" rx="10" ry="26" fill="none" stroke="#3E2A08" strokeWidth="1" />
          {[
            [44, 50],
            [76, 58],
            [60, 72],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill="#E8C879" />
          ))}
        </>
      )}
      {kind === 'wheel' && (
        <>
          {Array.from({ length: 32 }).map((_, i) => {
            const a = (i / 32) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={60 + Math.cos(a) * 34}
                y1={60 + Math.sin(a) * 34}
                x2={60 + Math.cos(a) * 44}
                y2={60 + Math.sin(a) * 44}
                stroke="#3E2A08"
                strokeWidth="1"
                opacity="0.5"
              />
            );
          })}
          <circle cx="60" cy="60" r="14" fill="#1a1a1a" />
          <path d="M60 46 a14 14 0 0 1 0 28 a7 7 0 0 0 0 -14 a7 7 0 0 1 0 -14 Z" fill="#E8C879" />
        </>
      )}
    </svg>
  );
}

export default function CoinShowcase() {
  return (
    <section className="border border-slate2 bg-card p-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">
        OOH Earth Genesis Coin
      </div>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">
        Physical artifact · cultural token · network seed
      </p>
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {FACES.map((f) => (
          <div key={f.id} className="border border-slate2 bg-void/40 p-4">
            <div className="flex justify-center">
              <CoinDisc kind={f.kind} />
            </div>
            <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-silver">
              {f.title}
            </div>
            <p className="mt-1 font-mono text-[9px] leading-snug text-silver/45">{f.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="border border-slate2 bg-void/40 p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">
            Edge — action verbs
          </div>
          <p className="mt-1 font-mono text-[10px] text-silver/45">
            Laser engraved with the verbs of the network.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {VERBS.map((v) => (
              <div
                key={v}
                className="border border-slate2 px-2 py-1.5 text-center font-mono text-[10px] uppercase tracking-wide text-silver/70"
              >
                {v}
              </div>
            ))}
          </div>
        </div>
        <div className="border border-slate2 bg-void/40 p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ozone">
            Coin specs
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[11px]">
            {SPECS.map(([k, v]) => (
              <div key={k}>
                <div className="text-[9px] uppercase tracking-widest text-silver/40">{k}</div>
                <div className="text-silver/80">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
