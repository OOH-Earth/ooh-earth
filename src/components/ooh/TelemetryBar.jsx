import { useState, useEffect } from 'react';
import { MapPin, Wind, Radio, Loader2 } from 'lucide-react';
import ClimateClock from '@/components/ooh/ClimateClock';
import DraggableTicker from '@/components/ooh/DraggableTicker';
import { useNewsHeadlines } from '@/hooks/useNewsHeadlines';

const BKK = { lat: 13.7563, lng: 100.5018 };

function band(v) {
  if (v <= 12) return '#39FF14';
  if (v <= 35) return '#EDFF00';
  if (v <= 55) return '#FFA500';
  if (v <= 150) return '#FF5C00';
  return '#FF007F';
}

function LiveFeed() {
  const { items, loading } = useNewsHeadlines();

  if (loading || !items.length) {
    return (
      <div className="flex h-full items-center gap-2 px-3">
        <Loader2 className="h-3 w-3 animate-spin text-ozone" />
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
          // acquiring intel…
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center gap-2 overflow-hidden">
      <span className="flex shrink-0 items-center gap-1.5 px-3 border-r border-slate2/60">
        <Radio className="h-3 w-3 animate-pulse text-ozone" />
        <span className="font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-ozone">
          LIVE
        </span>
      </span>
      <DraggableTicker>
        {items.map((it, i) => (
          <a
            key={i}
            href={it.url || '#'}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-2 px-4"
          >
            <span className="h-1 w-1 rounded-full bg-ozone" />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-silver/90 whitespace-nowrap">
              {it.title}
            </span>
            {it.source && (
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim whitespace-nowrap">
                · {it.source}
              </span>
            )}
            <span className="text-slate2">◆</span>
          </a>
        ))}
      </DraggableTicker>
    </div>
  );
}

export default function TelemetryBar() {
  const [pm, setPm] = useState(null);
  const [pmLoading, setPmLoading] = useState(true);
  const [loc, setLoc] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${BKK.lat}&longitude=${BKK.lng}&current=pm2_5`,
        );
        const j = await r.json();
        if (!cancelled) {
          setPm(j?.current?.pm2_5 ?? null);
          setPmLoading(false);
        }
      } catch {
        if (!cancelled) setPmLoading(false);
      }
    })();
    return () => {
      cancelled = false;
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  const pmColor = pm != null ? band(pm) : '#666';
  const latVal = loc ? loc.lat : BKK.lat;
  const lngVal = loc ? loc.lng : BKK.lng;
  const latDir = latVal >= 0 ? 'N' : 'S';
  const lngDir = lngVal >= 0 ? 'E' : 'W';

  return (
    <div className="flex items-stretch border-t border-slate2/60 bg-card/40 backdrop-blur-md">
      {/* Clock + 1.5°C deadline */}
      <div className="flex shrink-0 items-center px-3 border-r border-slate2/60">
        <ClimateClock />
      </div>

      {/* Coordinates */}
      <div className="hidden md:flex shrink-0 items-center gap-1.5 px-3 border-r border-slate2/60">
        <MapPin className="h-3 w-3 text-ozone" />
        <span className="font-mono text-[9px] tabular tracking-[0.05em] text-silver">
          {Math.abs(latVal).toFixed(4)}°{latDir} {Math.abs(lngVal).toFixed(4)}°{lngDir}
        </span>
      </div>

      {/* PM2.5 */}
      <div className="hidden lg:flex shrink-0 items-center gap-1.5 px-3 border-r border-slate2/60">
        <Wind className="h-3 w-3" style={{ color: pmColor }} />
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">PM2.5</span>
        <span className="font-mono text-[11px] font-bold tabular text-silver">
          {pmLoading ? '··' : pm != null ? Math.round(pm) : '—'}
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-darkgray">µg/m³</span>
      </div>

      {/* Live intel feed */}
      <div className="flex flex-1 items-center overflow-hidden">
        <LiveFeed />
      </div>
    </div>
  );
}
