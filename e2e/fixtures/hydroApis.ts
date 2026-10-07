import type { Page } from '@playwright/test';

// Deterministic USGS Water Data + UK Environment Agency stand-ins. CI never calls the real
// providers. Shapes mirror real responses captured on 2026-10-07 (see the PR for real-network QA).

export type HydroMode = 'ok' | 'empty' | 'error' | 'timeout' | 'slow';

const NOW = () => Date.now();
const iso = (msAgo: number) => new Date(NOW() - msAgo).toISOString();
const MIN = 60_000;
const DAY = 86_400_000;

const usgsValue = (
  id: string,
  code: '00060' | '00065',
  value: string | null,
  time: string,
  extra: Record<string, unknown> = {},
  coords: [number, number] = [-76.7, 39.2],
) => ({
  type: 'Feature',
  id: `${id}-${code}`,
  geometry: { type: 'Point', coordinates: coords },
  properties: {
    monitoring_location_id: id,
    parameter_code: code,
    value,
    time,
    unit_of_measure: code === '00060' ? 'ft^3/s' : 'ft',
    approval_status: 'Provisional',
    qualifier: null,
    statistic_id: '00011',
    ...extra,
  },
});

export const USGS_SITE_NAME = 'PATAPSCO RIVER AT HOLLOFIELD MD';

export const usgsFeatures = () => [
  // Fresh station with TWO measurements (flow + level)
  usgsValue('USGS-01589100', '00060', '12.5', iso(8 * MIN)),
  usgsValue('USGS-01589100', '00065', '2.31', iso(8 * MIN)),
  // Discontinued gauge: the "latest" value is decades old
  usgsValue(
    'USGS-01111111',
    '00060',
    '3.1',
    '1984-06-01T00:00:00+00:00',
    { qualifier: 'DISCONTINUED', approval_status: 'Approved' },
    [-76.5, 39.3],
  ),
  // Measurement present but with no value
  usgsValue('USGS-02222222', '00065', null, iso(5 * MIN), {}, [-76.9, 39.1]),
];

export const eaStations = () => [
  {
    '@id': 'http://environment.data.gov.uk/flood-monitoring/id/stations/E1',
    stationReference: 'E1',
    label: 'Kingston',
    riverName: 'River Thames',
    lat: 51.41,
    long: -0.31,
    measures: [
      {
        '@id': 'http://ea.test/measures/E1-level',
        parameter: 'level',
        qualifier: 'Stage',
        unitName: 'mAOD',
        period: 900,
      },
      {
        '@id': 'http://ea.test/measures/E1-flow',
        parameter: 'flow',
        qualifier: 'Flow',
        unitName: 'm3/s',
        period: 900,
      },
    ],
  },
  {
    '@id': 'http://environment.data.gov.uk/flood-monitoring/id/stations/E2',
    stationReference: 'E2',
    label: 'Unnamed-river gauge',
    lat: 51.45,
    long: -0.2,
    measures: [
      {
        '@id': 'http://ea.test/measures/E2-level',
        parameter: 'level',
        qualifier: 'Stage',
        unitName: 'mASD',
        period: 900,
      },
    ],
  },
];

export const eaReadings = () => [
  // E1 level is fresh; E1 flow has NO reading; E2 is 3 days old (stale)
  {
    '@id': 'r1',
    dateTime: iso(20 * MIN),
    measure: 'http://ea.test/measures/E1-level',
    value: 1.25,
  },
  { '@id': 'r2', dateTime: iso(3 * DAY), measure: 'http://ea.test/measures/E2-level', value: 0.4 },
];

export async function stubHydroApis(page: Page, opts: { usgs?: HydroMode; ea?: HydroMode } = {}) {
  const usgsMode = opts.usgs ?? 'ok';
  const eaMode = opts.ea ?? 'ok';
  const usgsRequests: URL[] = [];
  const usgsTimes: number[] = [];
  const usgsSiteRequests: string[] = [];
  const eaStationRequests: URL[] = [];
  const eaReadingRequests: URL[] = [];

  const respond = async (route: any, mode: HydroMode, body: unknown) => {
    if (mode === 'error') return route.fulfill({ status: 503, body: 'unavailable' });
    if (mode === 'timeout') return new Promise(() => {}); // never answers; the app must give up
    if (mode === 'slow') await new Promise((r) => setTimeout(r, 2500));
    return route.fulfill({ json: body, headers: { 'access-control-allow-origin': '*' } });
  };

  await page.route(
    (url) =>
      url.hostname === 'api.waterdata.usgs.gov' &&
      url.pathname.endsWith('/collections/latest-continuous/items'),
    (route) => {
      usgsRequests.push(new URL(route.request().url()));
      usgsTimes.push(Date.now());
      return respond(route, usgsMode, {
        type: 'FeatureCollection',
        features: usgsMode === 'empty' ? [] : usgsFeatures(),
        links: [],
      });
    },
  );
  await page.route(
    (url) =>
      url.hostname === 'api.waterdata.usgs.gov' &&
      /\/collections\/monitoring-locations\/items\/[^/]+$/.test(url.pathname),
    (route) => {
      usgsSiteRequests.push(new URL(route.request().url()).pathname);
      return route.fulfill({
        json: {
          type: 'Feature',
          properties: {
            id: 'USGS-01589100',
            monitoring_location_name: USGS_SITE_NAME,
            site_type: 'Stream',
            site_type_code: 'ST',
            state_name: 'Maryland',
          },
        },
      });
    },
  );
  await page.route(
    (url) =>
      url.hostname === 'environment.data.gov.uk' &&
      url.pathname === '/flood-monitoring/id/stations',
    (route) => {
      eaStationRequests.push(new URL(route.request().url()));
      return respond(route, eaMode, { items: eaMode === 'empty' ? [] : eaStations() });
    },
  );
  await page.route(
    (url) =>
      url.hostname === 'environment.data.gov.uk' &&
      url.pathname === '/flood-monitoring/data/readings',
    (route) => {
      eaReadingRequests.push(new URL(route.request().url()));
      return respond(route, eaMode, { items: eaMode === 'empty' ? [] : eaReadings() });
    },
  );
  return {
    usgsRequests,
    usgsTimes,
    usgsSiteRequests,
    eaStationRequests,
    eaReadingRequests,
  };
}
