import { useEffect, useMemo, useRef, useState } from 'react';

// Recent biodiversity observations from iNaturalist (community science, open API, CORS enabled).
// - Real observations with a date, not generated data.
// - Research grade only, last RECENT_DAYS days, obscured (location-protected) records excluded.
// - Fetched only for the visible area at a useful zoom, debounced, cancellable and cached.
import { requestObservations } from '@/lib/ecology/observations';
export { OBS_GROUPS } from '@/lib/ecology/observations';
export const OBS_MIN_ZOOM = 6;
export const RECENT_DAYS = 180;
const DEBOUNCE_MS = 600;
const MAX_SPAN_DEG = 20;

// Observations are dated by calendar day, so age is a calendar-day difference (UTC), not elapsed
// hours rounded: an observation from three days ago must read "3 days ago" at any time of day.
export function daysAgo(isoDate, now = Date.now()) {
  const t = Date.parse(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor(now / 86400000) - Math.floor(t / 86400000));
}
export function describeAge(isoDate, now = Date.now()) {
  const d = daysAgo(isoDate, now);
  if (d == null) return 'Unknown date';
  if (d === 0) return `${isoDate} (today)`;
  return `${isoDate} (${d} day${d === 1 ? '' : 's'} ago)`;
}

// viewport: { zoom, bounds: {west,south,east,north} } | null. enabled: array of group ids.
export function useObservations(viewport, enabled, moving = false) {
  const [state, setState] = useState({ status: 'idle', points: [], totals: {}, note: null });
  const abortRef = useRef(null);
  const enabledKey = enabled.join('|');

  const view = useMemo(() => {
    if (!viewport) return null;
    const { zoom, bounds } = viewport;
    return {
      zoom,
      key: [bounds.south, bounds.west, bounds.north, bounds.east]
        .map((n) => n.toFixed(1))
        .join(','),
      bounds,
    };
  }, [viewport]);

  useEffect(() => {
    abortRef.current?.abort();
    if (!view || !enabled.length || moving) {
      setState({ status: 'idle', points: [], totals: {}, note: null });
      return undefined;
    }
    if (view.zoom < OBS_MIN_ZOOM) {
      setState({ status: 'zoom', points: [], totals: {}, note: null });
      return undefined;
    }
    const { bounds } = view;
    if (bounds.north - bounds.south > MAX_SPAN_DEG || bounds.east - bounds.west > MAX_SPAN_DEG) {
      setState({ status: 'zoom', points: [], totals: {}, note: null });
      return undefined;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: 'loading', points: [], totals: {}, note: null });
    const since = new Date(Date.now() - RECENT_DAYS * 86400000).toISOString().slice(0, 10);

    const timer = setTimeout(async () => {
      const settled = await Promise.allSettled(
        enabled.map(async (group) => {
          const data = await requestObservations(group, bounds, since, controller.signal);
          return { group, ...data };
        }),
      );
      if (controller.signal.aborted) return;
      const ok = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value);
      if (!ok.length) {
        setState({ status: 'error', points: [], totals: {}, note: null });
        return;
      }
      const totals = {};
      ok.forEach((g) => {
        totals[g.group] = g.total;
      });
      setState({
        status: 'ready',
        points: ok.flatMap((g) => g.points.map((p) => ({ ...p, retrievedAt: g.retrievedAt }))),
        totals,
        note: ok.length < enabled.length ? 'Some observation groups could not be loaded.' : null,
      });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `enabled` is keyed by enabledKey so a new array identity does not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, enabledKey, moving]);

  return state;
}
