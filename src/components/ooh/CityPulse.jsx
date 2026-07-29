import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Wind, Gauge, Loader2 } from "lucide-react";

const CITIES_PM = {
  Bangkok: { lat: 13.7563, lng: 100.5018 },
  London: { lat: 51.489, lng: -0.013 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Jakarta: { lat: -6.2088, lng: 106.8456 },
  Tokyo: { lat: 35.6762, lng: 139.6503 },
  "New York": { lat: 40.7128, lng: -74.006 },
  Paris: { lat: 48.8566, lng: 2.3522 },
  "Sao Paulo": { lat: -23.5505, lng: -46.6333 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Lagos: { lat: 6.5244, lng: 3.3792 },
  Manila: { lat: 14.5995, lng: 120.9842 },
  Cairo: { lat: 30.0444, lng: 31.2357 },
  Berlin: { lat: 52.52, lng: 13.405 },
  Sydney: { lat: -33.8688, lng: 151.2093 },
  Mexico: { lat: 19.4326, lng: -99.1332 },
  Seoul: { lat: 37.5665, lng: 126.978 },
};

function cityOf(addr) {
  if (!addr) return null;
  const parts = String(addr).split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : null;
}

const WHO_24H = 15;

export default function CityPulse() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const recs = await base44.listAllLocations();
        const active = (recs || []).filter((r) => r.status !== "rejected");
        const tally = {};
        active.forEach((r) => {
          const c = cityOf(r.address);
          if (!c) return;
          tally[c] = (tally[c] || 0) + 1;
        });
        const cities = Object.entries(tally)
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        const pmResults = await Promise.all(
          cities.map(async (c) => {
            const geo = CITIES_PM[c.city];
            if (!geo) return [c.city, null];
            try {
              const r = await fetch(
                `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${geo.lat}&longitude=${geo.lng}&current=pm2_5`
              );
              const j = await r.json();
              return [c.city, j?.current?.pm2_5 ?? null];
            } catch {
              return [c.city, null];
            }
          })
        );
        const pmMap = Object.fromEntries(pmResults);

        const maxCount = Math.max(...cities.map((c) => c.count), 1);
        const withIndex = cities.map((c) => {
          const pm = pmMap[c.city];
          const pmMult = pm != null ? pm / WHO_24H : 0;
          const densityScore = c.count / maxCount;
          const index = Math.round(densityScore * 50 + Math.min(pmMult, 10) * 5);
          return { ...c, pm, index: Math.min(index, 100) };
        });

        if (!cancelled) setRows(withIndex);
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="city-pulse" className="border-t border-slate2/40 bg-void">
      <div className="px-5 py-16 md:px-8 md:py-24">
        <div className="flex flex-col gap-4 border-b border-slate2/40 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ozone">// Resistance index by city</span>
            <h2 className="mt-3 font-display text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-silver md:text-7xl">
              Where the<br />damage concentrates
            </h2>
          </div>
          <p className="max-w-sm font-display text-sm font-normal leading-[1.4] text-darkgray">
            A composite score per city — blending documented advertising offenses against live PM2.5 air pollution. The higher the index, the harder the air is working against the people who breathe it.
          </p>
        </div>

        {!rows ? (
          <div className="flex items-center gap-3 py-16">
            <Loader2 className="h-5 w-5 animate-spin text-ozone" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim">// computing resistance index…</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-dim">// No city data available</div>
        ) : (
          <div className="mt-10 divide-y divide-slate2/40 border border-slate2/60">
            {rows.map((r, i) => {
              const barW = Math.min(100, (r.count / rows[0].count) * 100);
              const pmMult = r.pm != null ? (r.pm / WHO_24H).toFixed(1) : "—";
              return (
                <div key={r.city} className="flex items-center gap-4 p-4 md:p-6">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center font-display text-sm font-black text-dim tabular">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <MapPin className="hidden h-3.5 w-3.5 text-ozone sm:block" />
                      <span className="truncate font-display text-lg font-bold tracking-[-0.02em] text-silver md:text-2xl">{r.city}</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-slate2/60">
                      <div className="h-full bg-ozone" style={{ width: `${barW}%` }} />
                    </div>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-darkgray">
                      <Wind className="h-3 w-3 text-flare" />
                      {r.pm != null ? `${Math.round(r.pm)} µg/m³` : "—"}
                    </div>
                    <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-dim">{pmMult}{r.pm != null ? "× WHO" : ""}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1.5 font-display text-2xl font-black tabular text-flare md:text-3xl">
                      <Gauge className="hidden h-4 w-4 sm:block" />
                      {r.index}
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">index</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-lg font-bold tabular text-silver md:text-xl">{r.count}</div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">logged</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-dim">
          // Index = offense density (50%) + PM2.5 over WHO limit (50%) · live air data via Open-Meteo
        </p>
      </div>
    </section>
  );
}