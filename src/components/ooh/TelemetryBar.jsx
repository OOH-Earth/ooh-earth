import { useState, useEffect, useRef } from 'react';
import { MapPin, Wind, Radio, Loader2 } from 'lucide-react';
import ClimateClock, { useClimateClock } from '@/components/ooh/ClimateClock';
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
        <span className="hidden font-mono text-ooh-caption uppercase tracking-[0.1em] text-quiet whitespace-nowrap sm:inline">
          // acquiring intel…
        </span>
        <span className="sr-only">Acquiring intel</span>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center gap-2 overflow-hidden">
      <span className="flex shrink-0 items-center gap-1.5 px-3 border-r border-slate2/60">
        <Radio className="h-3 w-3 animate-pulse text-ozone" />
        <span className="font-mono text-ooh-caption font-bold uppercase tracking-[0.1em] text-ozone">
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
            <span className="font-mono text-ooh-control uppercase tracking-[0.04em] text-silver/90 whitespace-nowrap">
              {it.title}
            </span>
            {it.source && (
              <span className="font-mono text-ooh-caption uppercase tracking-[0.1em] text-quiet whitespace-nowrap">
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
  // Narrow screens: the countdown, air quality and coordinates sit behind one labelled disclosure so the
  // strip keeps its deployed 31px height at readable sizes.
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const clock = useClimateClock();

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
      cancelled = true;
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

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const pmColor = pm != null ? band(pm) : '#666';
  const latVal = loc ? loc.lat : BKK.lat;
  const lngVal = loc ? loc.lng : BKK.lng;
  const latDir = latVal >= 0 ? 'N' : 'S';
  const lngDir = lngVal >= 0 ? 'E' : 'W';

  const pmText = pmLoading ? 'loading' : pm != null ? `${Math.round(pm)} µg/m³` : 'unavailable';
  const coordText = `${Math.abs(latVal).toFixed(4)}°${latDir} ${Math.abs(lngVal).toFixed(4)}°${lngDir}`;

  return (
    <div
      ref={rootRef}
      className="relative flex min-h-[31px] items-stretch border-t border-slate2/60 bg-card/40 backdrop-blur-md"
    >
      {/* Clock: a labelled disclosure below md, plain status from md up */}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="telemetry-details"
        aria-label="Climate clock and air quality details"
        onClick={() => setOpen((o) => !o)}
        className="flex shrink-0 items-center border-r border-slate2/60 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ozone md:hidden"
      >
        <ClimateClock variant="status" />
      </button>
      <div className="hidden shrink-0 items-center border-r border-slate2/60 px-3 md:flex">
        <ClimateClock variant="status" />
      </div>
      {open && (
        <div
          id="telemetry-details"
          role="region"
          aria-label="Climate and air quality details"
          className="absolute left-0 top-full z-10 w-full max-w-sm space-y-ooh-2 border border-slate2 bg-card p-ooh-4 font-display text-ooh-control text-silver md:hidden"
        >
          <p>
            <span className="font-bold text-flare">1.5°C deadline</span> in {clock.years}y{' '}
            {clock.days}d {String(clock.hours).padStart(2, '0')}:
            {String(clock.mins).padStart(2, '0')}:{String(clock.secs).padStart(2, '0')}
          </p>
          <p>
            <span className="text-quiet">Air quality (PM2.5):</span> {pmText}
          </p>
          <p>
            <span className="text-quiet">Coordinates:</span> {coordText}
          </p>
        </div>
      )}

      {/* Coordinates */}
      <div className="hidden md:flex shrink-0 items-center gap-1.5 px-3 border-r border-slate2/60">
        <MapPin className="h-3 w-3 text-ozone" />
        <span className="font-mono text-ooh-caption tabular tracking-[0.04em] text-silver">
          {Math.abs(latVal).toFixed(4)}°{latDir} {Math.abs(lngVal).toFixed(4)}°{lngDir}
        </span>
      </div>

      {/* PM2.5 */}
      <div className="hidden lg:flex shrink-0 items-center gap-1.5 px-3 border-r border-slate2/60">
        <Wind className="h-3 w-3" style={{ color: pmColor }} />
        <span className="font-mono text-ooh-caption uppercase tracking-[0.1em] text-quiet">
          PM2.5
        </span>
        <span className="font-mono text-ooh-caption font-bold tabular text-silver">
          {pmLoading ? '··' : pm != null ? Math.round(pm) : '—'}
        </span>
        <span className="font-mono text-ooh-caption uppercase tracking-[0.06em] text-darkgray">
          µg/m³
        </span>
      </div>

      {/* Live intel feed */}
      <div className="flex flex-1 items-center overflow-hidden">
        <LiveFeed />
      </div>
    </div>
  );
}
