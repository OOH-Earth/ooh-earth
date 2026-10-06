import { useEffect, useRef, useState } from 'react';
import { CloudSun, Loader2, X } from 'lucide-react';

// On-demand "conditions here": one user-initiated request for the map centre, never polling.
// Values are MODEL data (air quality: CAMS via Open-Meteo; weather: forecast-model analysis) for the
// nearest grid cell, not a station reading, and are labelled with the provider's own timestamp.
const AQ = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const WX = 'https://api.open-meteo.com/v1/forecast';

const fmt = (v, unit) => (v == null ? 'Unknown' : `${v} ${unit}`.trim());

export default function ConditionsCard({ center }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(
    /** @type {{ status: string, aq?: any, wx?: any, at?: any }} */ ({ status: 'idle' }),
  );
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const load = async () => {
    if (!center) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const [lng, lat] = center;
    setOpen(true);
    setState({ status: 'loading' });
    try {
      const aqUrl = `${AQ}?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}&current=pm2_5,pm10,us_aqi`;
      const wxUrl = `${WX}?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m`;
      const [aq, wx] = await Promise.all(
        [aqUrl, wxUrl].map(async (u) => {
          const r = await fetch(u, { signal: controller.signal });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }),
      );
      setState({ status: 'ready', aq, wx, at: { lat, lng } });
    } catch (e) {
      if (controller.signal.aborted) return;
      setState({ status: 'error' });
    }
  };

  return (
    <div className="absolute right-16 top-3 z-[900] flex max-w-[calc(100%-5rem)] flex-col items-end gap-1.5">
      <button
        type="button"
        aria-label="Check modelled conditions at the map centre"
        aria-expanded={open}
        onClick={load}
        className="flex min-h-11 items-center gap-2 border border-slate2 bg-void/85 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone focus-visible:outline focus-visible:outline-2 focus-visible:outline-ozone"
      >
        <CloudSun className="h-4 w-4" /> Conditions here
      </button>
      {open && (
        <section
          aria-label="Conditions at map centre"
          data-testid="env-conditions"
          className="w-72 max-w-full border border-slate2 bg-card/95 p-3 backdrop-blur-md"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">
                Modelled · near map centre
              </p>
              <h3 className="font-display text-sm font-bold text-silver">Conditions here</h3>
            </div>
            <button
              type="button"
              aria-label="Close conditions"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-slate2 text-silver hover:border-flare hover:text-flare focus-visible:outline focus-visible:outline-2 focus-visible:outline-ozone"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {state.status === 'loading' && (
            <p className="mt-2 flex items-center gap-2 text-[11px] text-darkgray">
              <Loader2 className="h-3 w-3 animate-spin text-ozone" /> Loading…
            </p>
          )}
          {state.status === 'error' && (
            <p className="mt-2 text-[11px] text-silver">
              Current conditions are unavailable right now. Try again in a moment.
            </p>
          )}
          {state.status === 'ready' && (
            <dl className="mt-2 space-y-1 text-[11px]">
              {[
                ['PM2.5', fmt(state.aq.current?.pm2_5, 'µg/m³')],
                ['PM10', fmt(state.aq.current?.pm10, 'µg/m³')],
                ['US AQI', fmt(state.aq.current?.us_aqi, '')],
                ['Temperature', fmt(state.wx.current?.temperature_2m, '°C')],
                ['Humidity', fmt(state.wx.current?.relative_humidity_2m, '%')],
                ['Precipitation', fmt(state.wx.current?.precipitation, 'mm')],
                ['Wind', fmt(state.wx.current?.wind_speed_10m, 'km/h')],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="w-24 shrink-0 text-dim">{k}</dt>
                  <dd className="text-silver">{v}</dd>
                </div>
              ))}
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-dim">Data type</dt>
                <dd className="text-silver">
                  <span className="border border-slate2 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-darkgray">
                    Derived
                  </span>{' '}
                  model data, not a station reading
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-dim">As of</dt>
                <dd className="font-mono text-silver">
                  {state.wx.current?.time || state.aq.current?.time || 'Unknown'} UTC
                </dd>
              </div>
              <p className="border-t border-slate2/60 pt-1.5 text-[9px] leading-snug text-dim">
                Source: Open-Meteo (air quality from CAMS, weather from national model data),
                nearest grid cell {state.wx.latitude?.toFixed?.(2)},{' '}
                {state.wx.longitude?.toFixed?.(2)}.
              </p>
            </dl>
          )}
        </section>
      )}
    </div>
  );
}
