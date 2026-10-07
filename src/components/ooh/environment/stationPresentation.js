// Turns normalized stations into map points, list items and honest status copy.
import { FRESHNESS_LABELS, formatAge } from '@/lib/hydro/freshness';
import { PROVIDERS, headlineMeasurement } from '@/lib/hydro/normalize';

export const FRESHNESS_COLOR = {
  current: '#39FF14',
  recent: '#EDFF00',
  stale: '#8A8A8A',
  none: '#555555',
};

const fmtValue = (v) =>
  v === null || v === undefined
    ? null
    : Number(v).toLocaleString('en', { maximumFractionDigits: 3 });

export function stationPointId(s) {
  return `${s.provider}:${s.stationId}`;
}

export function measurementSummary(m) {
  if (m.value === null) return `${m.label}: no observation from the provider`;
  return `${fmtValue(m.value)} ${m.unit || ''} · ${FRESHNESS_LABELS[m.freshness]}, ${formatAge(m.ageMs)}`.replace(
    '  ',
    ' ',
  );
}

// siteNames: Map(stationId -> normalizeUsgsSite result) loaded on selection.
export function stationToPoint(s, siteNames = new Map()) {
  const head = headlineMeasurement(s);
  const site = siteNames.get(s.stationId);
  const provider = PROVIDERS[s.provider];
  const name = s.name || site?.name || null;
  const rows = [
    { label: 'Station', value: `${name || 'Name not loaded'} (${s.stationId})` },
    {
      label: 'Waterbody',
      value:
        s.waterbody ||
        (site?.siteType ? `Not named by provider (${site.siteType})` : 'Not named by provider'),
    },
    ...s.measurements.map((m) => ({ label: m.label, value: measurementSummary(m) })),
    ...s.measurements
      .filter((m) => m.observedAt)
      .map((m) => ({
        label: `${m.type === 'stage' ? 'Level' : 'Flow'} observed`,
        value: m.observedAt,
      })),
    {
      label: 'Quality',
      value:
        s.measurements
          .flatMap((m) => [m.quality.approval, ...m.quality.qualifiers])
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(', ') || 'Not stated by provider',
    },
    { label: 'Measured by', value: provider.full },
    {
      label: 'Retrieved',
      value: new Date(s.measurements[0]?.retrievedAt || Date.now()).toISOString(),
    },
    { label: 'Source', value: 'View on provider site', href: s.sourceUrl },
  ];
  return {
    id: stationPointId(s),
    lat: s.latitude,
    lng: s.longitude,
    label: name || s.stationId,
    subtitle: `${provider.name} · observed station`,
    color: FRESHNESS_COLOR[head?.freshness || 'none'],
    trust: 'observed',
    trustNote: provider.attribution,
    rows,
    station: s,
  };
}

const REASON_COPY = {
  zoom: (p) => `${p} stations appear when zoomed in further.`,
  area: (p) => `${p}: zoom in further (this area is too large to query).`,
  outside: (p) =>
    `${p}: NO OBSERVATION COVERAGE here (England-focused provider). This is not a statement about the water.`,
};
const ERROR_COPY = {
  timeout: 'did not respond in time',
  http: 'returned an error',
  network: 'could not be reached',
  parse: 'returned an unreadable response',
};

// One line per provider that has something to say. Distinguishes provider failure from no data.
export function providerStatusLines(state) {
  const lines = [];
  for (const key of ['usgs', 'ea']) {
    const p = state[key];
    const name = key === 'usgs' ? 'USGS' : 'UK Environment Agency';
    if (p.status === 'gated') lines.push({ key, tone: 'info', text: REASON_COPY[p.reason](name) });
    else if (p.status === 'loading') lines.push({ key, tone: 'info', text: `${name}: loading…` });
    else if (p.status === 'error')
      lines.push({
        key,
        tone: 'error',
        text: `PROVIDER UNAVAILABLE: ${name} ${ERROR_COPY[p.errorKind] || 'failed'}. No observations shown from it.`,
      });
    else if (p.status === 'ready' && p.count === 0)
      lines.push({
        key,
        tone: 'info',
        text: `${name}: NO OBSERVATION COVERAGE in this view. Not evidence of anything about the water.`,
      });
    else if (p.status === 'ready')
      lines.push({
        key,
        tone: 'ok',
        text: `${name}: ${p.count} station${p.count === 1 ? '' : 's'} in view${p.truncated ? ' (area larger than one query: zoom in for the rest)' : ''}.`,
      });
  }
  return lines;
}

export function freshnessTally(stations) {
  const t = { current: 0, recent: 0, stale: 0, none: 0 };
  for (const s of stations) t[headlineMeasurement(s)?.freshness || 'none'] += 1;
  return t;
}
