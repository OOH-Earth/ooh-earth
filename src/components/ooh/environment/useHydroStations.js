import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchEaObserved, fetchUsgsStations, planViewport } from '@/lib/hydro/hydroApi';

// Observed river stations (USGS, UK Environment Agency) for the visible map area.
// Gated by zoom/area/coverage, debounced, cancelled on pan, cached (see hydroApi), and paused
// while the tab is hidden. Nothing here polls: a new fetch happens only when the settled
// viewport changes or the tab becomes visible again.
const DEBOUNCE_MS = 700;

const idle = () => ({
  status: 'idle',
  reason: null,
  errorKind: null,
  count: 0,
  truncated: false,
  retrievedAt: null,
});
const initial = () => ({ usgs: idle(), ea: idle(), stations: [] });

// `moving`: true between the map's movestart and moveend. Nothing is requested, and anything in
// flight is cancelled, while the view is still moving.
export function useHydroStations(viewport, enabled = true, moving = false) {
  const [state, setState] = useState(initial);
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const view = useMemo(() => {
    if (!viewport?.bounds) return null;
    const { west, south, east, north } = viewport.bounds;
    return { zoom: viewport.zoom, bbox: [west, south, east, north] };
  }, [viewport]);
  const viewKey = view
    ? `${view.zoom.toFixed(1)}|${view.bbox.map((n) => n.toFixed(2)).join(',')}`
    : '';
  const lastRef = useRef(null);

  useEffect(() => {
    if (!enabled || !view) {
      setState(initial());
      return undefined;
    }
    if (hidden || moving) return undefined; // no fetching while hidden or moving
    const plan = planViewport(view.bbox, view.zoom);
    const gated = (p) => ({ ...idle(), status: 'gated', reason: p.reason });
    const next = {
      usgs: plan.usgs.ok ? null : gated(plan.usgs),
      ea: plan.ea.ok ? null : gated(plan.ea),
    };
    if (!plan.usgs.ok && !plan.ea.ok) {
      setState({ usgs: next.usgs, ea: next.ea, stations: [] });
      return undefined;
    }
    const controller = new AbortController();
    const loading = { ...idle(), status: 'loading' };
    setState((s) => ({
      usgs: next.usgs || loading,
      ea: next.ea || loading,
      // Keep showing the previous stations while a refresh is in flight; each carries its own age.
      stations: s.stations,
    }));
    const timer = setTimeout(async () => {
      const run = async (key, load) => {
        try {
          const r = await load();
          return {
            key,
            ok: true,
            stations: r.stations,
            meta: {
              status: 'ready',
              reason: null,
              errorKind: null,
              count: r.stations.length,
              truncated: !!r.truncated,
              retrievedAt: r.retrievedAt,
            },
          };
        } catch (e) {
          if (e?.kind === 'aborted') return { key, aborted: true };
          return {
            key,
            ok: false,
            stations: [],
            meta: { ...idle(), status: 'error', errorKind: e?.kind || 'network' },
          };
        }
      };
      const jobs = [];
      if (plan.usgs.ok)
        jobs.push(run('usgs', () => fetchUsgsStations(view.bbox, { signal: controller.signal })));
      if (plan.ea.ok)
        jobs.push(run('ea', () => fetchEaObserved(view.bbox, { signal: controller.signal })));
      const results = await Promise.all(jobs);
      if (controller.signal.aborted || results.some((r) => r.aborted)) return;
      const out = { usgs: next.usgs || idle(), ea: next.ea || idle(), stations: [] };
      for (const r of results) {
        out[r.key] = r.meta;
        out.stations.push(...r.stations);
      }
      lastRef.current = viewKey;
      setState(out);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // viewKey captures the settled viewport; hidden/enabled gate fetching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey, enabled, hidden, moving]);

  return state;
}
