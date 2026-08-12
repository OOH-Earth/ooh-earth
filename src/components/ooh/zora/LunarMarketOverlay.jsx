import useCoinData from '@/components/ooh/zora/useCoinData';
import { PRIMARY_COIN, fmtPrice } from '@/components/ooh/zora/zoraConfig';

const SYNODIC = 29.530588853;
const EPOCH_NEW = new Date('2000-01-06T18:14:00Z').getTime();

function moonPhase(date) {
  const diff = (date.getTime() - EPOCH_NEW) / 86400000;
  return (((diff % SYNODIC) + SYNODIC) % SYNODIC) / SYNODIC; // 0 new · 0.5 full
}

function phaseLabel(p) {
  if (p < 0.03 || p > 0.97) return 'New';
  if (p < 0.22) return 'Waxing crescent';
  if (p < 0.28) return 'First quarter';
  if (p < 0.47) return 'Waxing gibbous';
  if (p < 0.53) return 'Full';
  if (p < 0.72) return 'Waning gibbous';
  if (p < 0.78) return 'Last quarter';
  return 'Waning crescent';
}

// Moon-phase timeline × live market readout.
// (True price×moon correlation needs historical OHLC across lunar cycles — not available here.)
export default function LunarMarketOverlay() {
  const { data: d } = useCoinData(PRIMARY_COIN.addr, 30000);
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const dt = new Date(today.getTime() + i * 86400000);
    const p = moonPhase(dt);
    return {
      dt,
      p,
      label: phaseLabel(p),
      isToday: i === 0,
      isFull: p > 0.47 && p < 0.53,
      isNew: p < 0.03 || p > 0.97,
    };
  });
  const todayPhase = days[0];

  return (
    <div className="border border-slate2/60 bg-card p-5 md:p-7">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
          // lunar × market overlay
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
          synodic · 29.53d
        </span>
      </div>

      <div className="flex items-center gap-4 border-b border-slate2/40 pb-3">
        <MoonGlyph phase={todayPhase.p} />
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">tonight</div>
          <div className="font-display text-lg font-bold text-silver">{todayPhase.label}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
            {PRIMARY_COIN.symbol} now
          </div>
          <div className="font-mono text-lg font-bold text-ozone">
            {d ? fmtPrice(d.price) : '…'}
          </div>
        </div>
      </div>

      {/* 30-day moon-phase band */}
      <div className="mt-4 flex gap-0.5">
        {days.map((day, i) => (
          <div
            key={i}
            className="group relative flex-1"
            title={`${day.dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${day.label}`}
          >
            <div
              className="h-12 w-full"
              style={{
                background: day.isNew
                  ? '#000'
                  : day.isFull
                    ? '#EDFF00'
                    : day.p < 0.5
                      ? `rgba(237,255,0,${0.1 + day.p * 0.6})`
                      : `rgba(237,255,0,${0.1 + (1 - day.p) * 0.6})`,
                outline: day.isToday ? '1px solid #FF5C00' : 'none',
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
        <span>now</span>
        <span>+30d</span>
      </div>

      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
        full-moon windows marked ozone · action-intensity scales with phase brightness · price
        readout live
      </p>
    </div>
  );
}

function MoonGlyph({ phase }) {
  // simple phase disc via two overlapping circles
  const r = 18;
  const offset = phase < 0.5 ? (1 - phase * 2) * r : (phase * 2 - 1) * r;
  return (
    <svg width={r * 2 + 4} height={r * 2 + 4} viewBox={`0 0 ${r * 2 + 4} ${r * 2 + 4}`}>
      <circle cx={r + 2} cy={r + 2} r={r} className="fill-silver/15" />
      <circle
        cx={r + 2 + (phase < 0.5 ? -offset : offset)}
        cy={r + 2}
        r={r}
        className="fill-silver"
        style={{ clipPath: `inset(0 0 0 50%)` }}
        transform={phase < 0.5 ? '' : 'scale(-1,1) translate(-40,0)'}
      />
      <circle
        cx={r + 2}
        cy={r + 2}
        r={r}
        className="stroke-silver/40"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}
