import { useState } from 'react';
import { ChevronDown, ChevronUp, TriangleAlert } from 'lucide-react';
import { PROVIDERS } from '@/lib/hydro/normalize';
import { FRESHNESS_COLOR, freshnessTally, providerStatusLines } from './stationPresentation';

// Provider-by-provider state of the observed-station layer. A failed provider is reported as
// PROVIDER UNAVAILABLE and kept visibly distinct from "no coverage" and "no recent observation".
export default function StationStatus({ state }) {
  const [open, setOpen] = useState(false);
  const lines = providerStatusLines(state);
  if (!lines.length) return null;
  const tally = freshnessTally(state.stations);
  const hasError = lines.some((l) => l.tone === 'error');
  return (
    <div
      className="absolute right-16 top-3 z-[900] flex max-w-[min(20rem,calc(100%-5rem))] flex-col items-end gap-1.5"
      data-testid="station-status"
      aria-live="polite"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${open ? 'Hide' : 'Show'} observed station status`}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[44px] items-center gap-1.5 border border-slate2 bg-void/85 px-2.5 font-mono text-[9px] uppercase tracking-[0.15em] text-darkgray backdrop-blur-md hover:border-ozone hover:text-ozone focus-visible:outline focus-visible:outline-2 focus-visible:outline-ozone"
      >
        {hasError && <TriangleAlert className="h-3 w-3 text-flare" />}
        Observed stations · {state.stations.length}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {!open && hasError && (
        <p className="border border-flare/50 bg-void/90 px-2 py-1 text-[10px] leading-snug text-flare">
          {lines.find((l) => l.tone === 'error').text}
        </p>
      )}
      {open && (
        <div className="w-full border border-slate2 bg-void/95 p-2.5 text-[10px] leading-snug text-silver backdrop-blur-md">
          <ul className="space-y-1.5">
            {lines.map((l) => (
              <li key={l.key} className={l.tone === 'error' ? 'text-flare' : 'text-silver'}>
                {l.text}
              </li>
            ))}
          </ul>
          {state.stations.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate2/60 pt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-darkgray">
              {[
                ['current', 'Current'],
                ['recent', 'Recent'],
                ['stale', 'Stale'],
                ['none', 'No recent obs.'],
              ].map(([k, label]) => (
                <li key={k} className="flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: FRESHNESS_COLOR[k] }}
                  />
                  {label} {tally[k]}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 border-t border-slate2/60 pt-2 text-[9px] text-dim">
            Observed = a dated measurement from the named provider. {PROVIDERS.usgs.attribution}{' '}
            {PROVIDERS.ea.attribution} A missing station is not evidence about the water.
          </p>
        </div>
      )}
    </div>
  );
}
