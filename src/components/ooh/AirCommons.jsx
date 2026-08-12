import { useState, useEffect } from 'react';
import { Wind, Activity, Loader2 } from 'lucide-react';

const CITIES = [
  {
    city: 'Bangkok',
    lat: 13.7563,
    lng: 100.5018,
    coords: '13.7563°N · 100.5018°E',
    status: 'Active chapter',
  },
  {
    city: 'London',
    lat: 51.489,
    lng: -0.013,
    coords: '51.4890°N · 0.0130°E',
    status: 'Active chapter',
  },
  {
    city: 'Delhi',
    lat: 28.6139,
    lng: 77.209,
    coords: '28.6139°N · 77.2090°E',
    status: 'Monitored',
  },
  {
    city: 'Jakarta',
    lat: -6.2088,
    lng: 106.8456,
    coords: '6.2088°S · 106.8456°E',
    status: 'Monitored',
  },
];

const WHO_24H = 15; // µg/m³ — WHO 24-hour guideline
const SCALE_MAX = 150;

function band(v) {
  if (v <= 12) return { label: 'Good', color: '#39FF14' };
  if (v <= 35) return { label: 'Moderate', color: '#EDFF00' };
  if (v <= 55) return { label: 'Unhealthy · sensitive', color: '#FFA500' };
  if (v <= 150) return { label: 'Unhealthy', color: '#FF5C00' };
  return { label: 'Very unhealthy', color: '#FF007F' };
}

export default function AirCommons() {
  const [pm, setPm] = useState({});
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        CITIES.map(async (c) => {
          try {
            const r = await fetch(
              `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${c.lat}&longitude=${c.lng}&current=pm2_5`,
            );
            const j = await r.json();
            return [c.city, j?.current?.pm2_5 ?? null];
          } catch {
            return [c.city, null];
          }
        }),
      );
      if (!cancelled) {
        setPm(Object.fromEntries(results));
        setUpdated(new Date());
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="air" className="relative border-t border-slate2/40 bg-void">
      <div className="hi-vis-stripes h-1 w-full opacity-80" />
      <div className="px-5 py-16 md:px-8 md:py-24">
        <div className="flex flex-col gap-4 border-b border-slate2/40 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">
              // Section 03 — Air commons index
            </span>
            <h2 className="mt-3 font-display text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-7xl">
              The air
              <br />
              they sell
            </h2>
          </div>
          <p className="max-w-sm font-display text-sm font-normal leading-[1.4] text-darkgray">
            Outdoor advertising accelerates the consumption economy that poisons the air. PM2.5 is
            the measurable proof — so we log it live alongside every intervention. The brands on the
            billboards and the particulates in our lungs share a supply chain.
          </p>
        </div>

        <div className="mt-10 border border-slate2/60">
          {CITIES.map((c, i) => {
            const v = pm[c.city];
            const has = v != null;
            const b = has ? band(v) : { label: 'No signal', color: '#666' };
            const mult = has ? (v / WHO_24H).toFixed(1) : '—';
            const fillW = has ? Math.min(100, (v / SCALE_MAX) * 100) : 0;
            const whoLeft = (WHO_24H / SCALE_MAX) * 100;
            return (
              <div
                key={c.city}
                className={`p-6 md:p-8 ${i !== CITIES.length - 1 ? 'border-b border-slate2/60' : ''}`}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div className="flex items-baseline gap-3">
                    <Wind className="hidden h-4 w-4 text-dim sm:block" />
                    <div>
                      <h3 className="font-display text-2xl font-bold leading-[1.1] tracking-[-0.02em] text-silver md:text-3xl">
                        {c.city}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                        <span>{c.coords}</span>
                        <span className="text-slate2">·</span>
                        <span
                          className={c.status === 'Active chapter' ? 'text-ozone' : 'text-darkgray'}
                        >
                          {c.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {loading ? (
                      <Loader2 className="ml-auto h-5 w-5 animate-spin text-dim" />
                    ) : (
                      <div className="font-display text-4xl font-black leading-none tracking-[-0.02em] text-silver md:text-5xl">
                        {has ? Math.round(v) : '—'}
                      </div>
                    )}
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-darkgray">
                      µg/m³
                    </div>
                  </div>
                </div>

                <div className="relative mt-5 h-2 w-full bg-slate2/60">
                  <div
                    className="absolute inset-y-0 left-0"
                    style={{ width: `${fillW}%`, backgroundColor: b.color }}
                  />
                  <div
                    className="absolute inset-y-[-4px] w-px bg-silver/60"
                    style={{ left: `${whoLeft}%` }}
                    title="WHO 24-hour guideline"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: b.color }}
                    />
                    <span className="text-silver/70">{b.label}</span>
                  </span>
                  <span className="text-flare">
                    {mult}
                    {has ? '× WHO limit' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate2/40 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-darkgray">
            <Activity className="h-3.5 w-3.5 text-ozone" />
            Live PM2.5 · Open-Meteo · WHO 24-hour guideline 15 µg/m³
            {updated && (
              <span className="text-dim">
                · updated{' '}
                {updated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
          <p className="font-display text-sm font-medium leading-[1.4] text-silver/70">
            The air commons is not for sale.
          </p>
        </div>
      </div>
    </section>
  );
}
