import Nav from '@/components/ooh/Nav';
import Breadcrumbs from '@/components/ooh/Breadcrumbs';
import SiteFooter from '@/components/ooh/SiteFooter';
import { Link } from 'react-router-dom';

// OOH Earth — Living Coin (Lab)
// Production spec / technical drawings for the physical "coin cube": a rounded
// brass cube with six independently rotating coin-face medallions — the tactile
// ancestor of the Genesis Coin and the six-ring Hex Engine. Digital → physical.

const OBJ = '#cdd2cc',
  CON = '#5a6070',
  DIM = '#7d8aa0',
  KEY = '#EDFF00',
  HATCH = '#3a4150';

// Six rotating faces, reverse-engineered from the reference + mapped to OOH layers.
const FACES = [
  {
    cn: '太极 · 八卦',
    py: 'Tàijí · Bā Guà',
    en: 'Yin-yang + eight trigrams',
    map: 'Compose · protocol index',
  },
  { cn: '招财进宝', py: 'Zhāo Cái Jìn Bǎo', en: 'Summon wealth, bring treasure', map: 'Wallet' },
  { cn: '财源滚滚', py: 'Cái Yuán Gǔn Gǔn', en: 'Wealth flows in', map: 'Treasury · DAO' },
  { cn: '时来运转', py: 'Shí Lái Yùn Zhuǎn', en: 'Fortune turns', map: 'Movement · the spin' },
  {
    cn: '雙龍戲珠',
    py: 'Shuāng Lóng Xì Zhū',
    en: 'Twin dragons + pearl',
    map: 'Identity · the mark',
  },
  {
    cn: '牛轉乾坤',
    py: 'Niú Zhuǎn Qián Kūn',
    en: 'Turn of heaven & earth',
    map: 'Verify · fortune',
  },
];

const SPEC = [
  ['Form', 'Rounded cube (superellipsoid), 6 faces'],
  ['Overall', '52 × 52 × 52 mm'],
  ['Corner radius', 'R16 mm'],
  ['Face medallion', 'Ø38 mm, recessed 3 mm'],
  ['Rotation', 'Each face on a sealed thrust bearing — all 6 spin'],
  ['Detent', 'Sprung ball · light indexing per face'],
  ['Material', 'CNC C38500 brass, solid'],
  ['Finish', 'Antique brass PVD + satin bead-blast'],
  ['Engraving', 'CNC relief + laser-etched coin edge'],
  ['Weight', '≈ 230 g'],
  ['Tolerance', '±0.05 mm faces · H7/g6 bearing fit'],
  ['Edition', 'Matches Genesis Coin № · 1:1 onchain twin'],
];

// mini schematic glyphs
function Coin({ x, y, r }) {
  return (
    <g stroke={OBJ} strokeWidth="0.8" fill="none">
      <circle cx={x} cy={y} r={r} />
      <circle cx={x} cy={y} r={r * 0.86} stroke={CON} strokeDasharray="2 2" />
      <rect x={x - r * 0.22} y={y - r * 0.22} width={r * 0.44} height={r * 0.44} />
    </g>
  );
}

export default function HexCoinCube() {
  return (
    <div className="min-h-screen bg-void grid-bg text-silver">
      <Nav />
      <div className="mx-auto max-w-6xl page-top px-6 pb-12">
        <Breadcrumbs
          items={[{ label: 'Lab', to: '/lab' }, { label: 'Living Coin' }]}
          className="mb-4"
        />
        <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-slate2 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-[0.14em]">
            Living <span className="text-ozone">Coin</span>
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-silver/50">
            Coin cube · six rotating faces · production spec
          </p>
          <div className="ml-auto flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em]">
            <Link to="/lab/coin" className="text-silver/40 transition-colors hover:text-ozone">
              Genesis Coin
            </Link>
            <Link to="/lab/device" className="text-silver/40 transition-colors hover:text-ozone">
              3D Device
            </Link>
            <span className="border border-flare/40 px-2 py-0.5 text-flare">Working copy</span>
          </div>
        </header>

        <p className="my-6 max-w-3xl font-mono text-xs leading-loose text-silver/50">
          The tactile ancestor: a solid brass rounded cube whose six coin-medallion faces each
          rotate independently — a fidget object drawn from Chinese feng-shui coin balls.
          Reverse-engineered here into manufacturing drawings. Its six spinning faces are the
          physical logic of the six-ring Hex Engine, and it carries the Genesis Coin's edition
          number as a 1:1 onchain twin. Digital concept → physical production spec.
        </p>

        {/* ORTHOGRAPHIC PROJECTION */}
        <div className="border border-slate2 bg-card p-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">
            Orthographic projection · front + section
          </div>
          <svg viewBox="0 0 720 400" className="mt-4 w-full font-mono" style={{ maxHeight: 440 }}>
            {/* FRONT ELEVATION */}
            <text x="180" y="376" textAnchor="middle" fill={DIM} fontSize="11">
              FRONT ELEVATION
            </text>
            <rect
              x="70"
              y="92"
              width="220"
              height="220"
              rx="64"
              fill="none"
              stroke={OBJ}
              strokeWidth="1.2"
            />
            {/* centre lines */}
            <line
              x1="180"
              y1="72"
              x2="180"
              y2="332"
              stroke={CON}
              strokeWidth="0.6"
              strokeDasharray="6 3"
            />
            <line
              x1="50"
              y1="202"
              x2="310"
              y2="202"
              stroke={CON}
              strokeWidth="0.6"
              strokeDasharray="6 3"
            />
            {/* medallion + coin */}
            <circle cx="180" cy="202" r="88" fill="none" stroke={OBJ} strokeWidth="1" />
            <circle
              cx="180"
              cy="202"
              r="80"
              fill="none"
              stroke={CON}
              strokeWidth="0.6"
              strokeDasharray="2 2"
            />
            {/* ba gua ticks + taiji */}
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i * 45 * Math.PI) / 180;
              const x1 = 180 + 64 * Math.cos(a),
                y1 = 202 + 64 * Math.sin(a);
              const x2 = 180 + 74 * Math.cos(a),
                y2 = 202 + 74 * Math.sin(a);
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={OBJ} strokeWidth="0.8" />
              );
            })}
            <circle cx="180" cy="202" r="20" fill="none" stroke={OBJ} strokeWidth="0.8" />
            <path
              d="M180 182 a10 10 0 0 1 0 20 a10 10 0 0 0 0 20"
              fill="none"
              stroke={OBJ}
              strokeWidth="0.8"
            />
            {/* dimensions */}
            <line x1="70" y1="60" x2="290" y2="60" stroke={DIM} strokeWidth="0.6" />
            <line x1="70" y1="55" x2="70" y2="65" stroke={DIM} strokeWidth="0.6" />
            <line x1="290" y1="55" x2="290" y2="65" stroke={DIM} strokeWidth="0.6" />
            <text x="180" y="52" textAnchor="middle" fill={KEY} fontSize="11">
              52
            </text>
            <line
              x1="92"
              y1="202"
              x2="268"
              y2="202"
              stroke={DIM}
              strokeWidth="0.6"
              strokeDasharray="1 3"
            />
            <text x="234" y="230" fill={KEY} fontSize="11">
              Ø38
            </text>
            <text x="300" y="120" fill={KEY} fontSize="11">
              R16
            </text>
            <path d="M298 124 L286 132" stroke={DIM} strokeWidth="0.6" />

            {/* SECTION A-A */}
            <text x="540" y="376" textAnchor="middle" fill={DIM} fontSize="11">
              SECTION A–A
            </text>
            <rect
              x="430"
              y="92"
              width="220"
              height="220"
              rx="64"
              fill="none"
              stroke={OBJ}
              strokeWidth="1.2"
            />
            {/* hatching corner */}
            {Array.from({ length: 8 }).map((_, i) => (
              <line
                key={i}
                x1={445 + i * 14}
                y1="300"
                x2={465 + i * 14}
                y2="280"
                stroke={HATCH}
                strokeWidth="0.5"
              />
            ))}
            {/* recessed rotating disc (edge-on, right face) */}
            <line x1="650" y1="150" x2="650" y2="254" stroke={OBJ} strokeWidth="1" />
            <rect
              x="636"
              y="150"
              width="14"
              height="104"
              fill="none"
              stroke={OBJ}
              strokeWidth="0.8"
            />
            <line x1="640" y1="202" x2="646" y2="202" stroke={OBJ} strokeWidth="0.8" />
            <circle cx="540" cy="202" r="4" fill="none" stroke={OBJ} strokeWidth="0.8" />
            {/* depth dim */}
            <line x1="676" y1="92" x2="676" y2="312" stroke={DIM} strokeWidth="0.6" />
            <line x1="671" y1="92" x2="681" y2="92" stroke={DIM} strokeWidth="0.6" />
            <line x1="671" y1="312" x2="681" y2="312" stroke={DIM} strokeWidth="0.6" />
            <text x="690" y="206" fill={KEY} fontSize="11">
              52
            </text>
            {/* callout */}
            <text x="430" y="80" fill={KEY} fontSize="10">
              rotating face · recessed 3
            </text>
            <path d="M560 84 L636 160" stroke={DIM} strokeWidth="0.5" strokeDasharray="2 2" />
          </svg>
        </div>

        {/* ROTATION MECHANISM */}
        <div className="mt-6 border border-slate2 bg-card p-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">
            Rotation mechanism · exploded (one face)
          </div>
          <svg viewBox="0 0 720 260" className="mt-4 w-full font-mono">
            <line
              x1="40"
              y1="130"
              x2="680"
              y2="130"
              stroke={CON}
              strokeWidth="0.6"
              strokeDasharray="6 3"
            />
            {[
              { x: 90, label: 'Body recess', sub: 'brass housing' },
              { x: 240, label: 'Thrust bearing', sub: 'sealed ball race' },
              { x: 380, label: 'Detent', sub: 'sprung ball' },
              { x: 520, label: 'Coin face', sub: 'rotating disc' },
              { x: 640, label: 'Retainer', sub: 'C-clip' },
            ].map((p, i) => (
              <g key={i}>
                {p.label === 'Body recess' && (
                  <path
                    d={`M${p.x - 34} 88 h68 v48 a20 20 0 0 1 -20 20 h-28 a20 20 0 0 1 -20 -20 z`}
                    fill="none"
                    stroke={OBJ}
                    strokeWidth="1"
                  />
                )}
                {p.label === 'Thrust bearing' && (
                  <>
                    <circle cx={p.x} cy="130" r="30" fill="none" stroke={OBJ} strokeWidth="1" />
                    <circle cx={p.x} cy="130" r="20" fill="none" stroke={OBJ} strokeWidth="0.8" />
                    {Array.from({ length: 8 }).map((_, k) => {
                      const a = (k * 45 * Math.PI) / 180;
                      return (
                        <circle
                          key={k}
                          cx={p.x + 25 * Math.cos(a)}
                          cy={130 + 25 * Math.sin(a)}
                          r="2.4"
                          fill="none"
                          stroke={OBJ}
                          strokeWidth="0.7"
                        />
                      );
                    })}
                  </>
                )}
                {p.label === 'Detent' && (
                  <>
                    <circle cx={p.x} cy="112" r="4" fill="none" stroke={OBJ} strokeWidth="0.8" />
                    <path
                      d={`M${p.x} 116 l-4 10 h8 z`}
                      fill="none"
                      stroke={OBJ}
                      strokeWidth="0.8"
                    />
                    <path
                      d={`M${p.x - 5} 128 l5 8 l5 -8`}
                      fill="none"
                      stroke={OBJ}
                      strokeWidth="0.8"
                    />
                  </>
                )}
                {p.label === 'Coin face' && (
                  <>
                    <circle cx={p.x} cy="130" r="34" fill="none" stroke={OBJ} strokeWidth="1.2" />
                    <Coin x={p.x} y={130} r={26} />
                  </>
                )}
                {p.label === 'Retainer' && (
                  <path d="M640 100 a30 30 0 1 0 0 60" fill="none" stroke={OBJ} strokeWidth="1.4" />
                )}
                <line x1={p.x} y1="176" x2={p.x} y2="196" stroke={DIM} strokeWidth="0.5" />
                <text x={p.x} y="210" textAnchor="middle" fill={KEY} fontSize="10">
                  {p.label}
                </text>
                <text x={p.x} y="224" textAnchor="middle" fill={DIM} fontSize="9">
                  {p.sub}
                </text>
              </g>
            ))}
          </svg>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-silver/40">
            Each of the six faces is an independent assembly — press-fit into the body, free to
            spin, lightly indexed by a sprung ball. Spin any face; all six move.
          </p>
        </div>

        {/* SIX FACES MAP */}
        <div className="mt-6 border border-slate2 bg-card p-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">
            Six faces → OOH layers
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FACES.map((f, i) => (
              <div key={i} className="flex items-center gap-3 border border-slate2 p-3">
                <svg viewBox="0 0 60 60" className="h-14 w-14 shrink-0">
                  {i === 0 ? (
                    <g stroke={OBJ} strokeWidth="0.8" fill="none">
                      <circle cx="30" cy="30" r="24" />
                      {Array.from({ length: 8 }).map((_, k) => {
                        const a = (k * 45 * Math.PI) / 180;
                        return (
                          <line
                            key={k}
                            x1={30 + 17 * Math.cos(a)}
                            y1={30 + 17 * Math.sin(a)}
                            x2={30 + 23 * Math.cos(a)}
                            y2={30 + 23 * Math.sin(a)}
                          />
                        );
                      })}
                      <circle cx="30" cy="30" r="9" />
                      <path d="M30 21 a4.5 4.5 0 0 1 0 9 a4.5 4.5 0 0 0 0 9" />
                    </g>
                  ) : (
                    <Coin x={30} y={30} r={22} />
                  )}
                </svg>
                <div className="min-w-0">
                  <div className="text-lg font-bold leading-tight text-ozone">{f.cn}</div>
                  <div className="font-mono text-[9px] uppercase tracking-wide text-silver/40">
                    {f.py}
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-silver/70">{f.en}</div>
                  <div className="font-mono text-[10px] text-brand-green">→ {f.map}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PRODUCTION SPEC */}
        <div className="mt-6 border border-slate2 bg-card p-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ozone">
            Production spec
          </div>
          <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {SPEC.map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-4 border-b border-slate2/40 py-1.5 font-mono text-[11px]"
              >
                <span className="text-silver/40">{k}</span>
                <span className="text-right text-silver/80">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
