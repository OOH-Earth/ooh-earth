import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BUS_STOP_AREAS } from '@/components/ooh/busStops';
import KeyGlyph from '@/components/ooh/KeyGlyph';

const FACING_COLOR = { pavement: '#880E4F', road: '#FF5252' };

const AREA_INDEX = (() => {
  const m = {};
  BUS_STOP_AREAS.forEach(({ area, stops }) =>
    stops.forEach((s) => {
      m[s.id] = area;
    }),
  );
  return m;
})();

export default function AreaDirectory({ stops }) {
  const groups = useMemo(() => {
    const map = new Map();
    for (const s of stops) {
      const a = AREA_INDEX[s.id] || 'Lambeth & Southwark';
      if (!map.has(a)) map.set(a, []);
      map.get(a).push(s);
    }
    return Array.from(map, ([area, list]) => ({ area, list })).sort(
      (a, b) => b.list.length - a.list.length,
    );
  }, [stops]);

  if (!stops.length) {
    return (
      <div className="py-12 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
        // no stops match
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map(({ area, list }) => (
        <section key={area}>
          <div className="mb-2 flex items-center gap-2 border-b border-slate2/60 pb-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">
              // {area}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim/50">
              · {list.length}
            </span>
            <span className="h-px flex-1 bg-slate2/30" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((b) => (
              <Link
                key={b.id}
                to={`/bus-stop/${b.id}`}
                className="group flex flex-col gap-2 border border-slate2/60 p-3 transition-colors hover:border-ozone/60 hover:bg-slate2/10"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em]"
                    style={{ color: FACING_COLOR[b.facing] }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: FACING_COLOR[b.facing] }}
                    />
                    {b.facing}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.2em] text-flare">
                    <KeyGlyph slug="unknown" className="h-3.5 w-3.5" /> unconfirmed
                  </span>
                </div>
                <span className="font-display text-[14px] font-semibold leading-tight text-silver transition-colors group-hover:text-ozone">
                  {b.name}
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] tabular text-dim/70">
                    {b.lat.toFixed(4)}, {b.lng.toFixed(4)}
                  </span>
                  {b.shape === 'shelter' && (
                    <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-ozone/70">
                      shelter
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
