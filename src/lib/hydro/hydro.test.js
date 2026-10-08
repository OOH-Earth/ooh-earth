import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyFreshness, formatAge, FRESHNESS } from './freshness.js';
import {
  normalizeUsgs,
  normalizeUsgsSite,
  normalizeEa,
  indexEaReadings,
  headlineMeasurement,
} from './normalize.js';

const NOW = Date.parse('2026-10-07T12:00:00Z');
const ago = (ms) => new Date(NOW - ms).toISOString();
const MIN = 60_000;
const H = 3_600_000;

test('freshness: current, recent, stale and unparseable', () => {
  assert.equal(classifyFreshness(ago(10 * MIN), NOW).status, FRESHNESS.CURRENT);
  assert.equal(classifyFreshness(ago(5 * H), NOW).status, FRESHNESS.RECENT);
  assert.equal(classifyFreshness(ago(3 * 24 * H), NOW).status, FRESHNESS.STALE);
  assert.equal(classifyFreshness(ago(42 * 365 * 24 * H), NOW).status, FRESHNESS.STALE);
  assert.equal(classifyFreshness(null, NOW).status, FRESHNESS.NONE);
  assert.equal(classifyFreshness('not a date', NOW).status, FRESHNESS.NONE);
});

test('freshness: provider reading interval widens CURRENT, never beyond what it publishes', () => {
  // 15 min cadence -> 1 h floor applies; a 6 h cadence is current for up to 24 h of ages 4x.
  assert.equal(classifyFreshness(ago(90 * MIN), NOW, 900).status, FRESHNESS.RECENT);
  assert.equal(classifyFreshness(ago(5 * H), NOW, 6 * 3600).status, FRESHNESS.CURRENT);
});

test('freshness: future timestamps clamp to zero age instead of going negative', () => {
  assert.equal(classifyFreshness(new Date(NOW + H).toISOString(), NOW).ageMs, 0);
});

test('formatAge', () => {
  assert.equal(formatAge(30 * 1000), 'just now');
  assert.equal(formatAge(7 * MIN), '7 min ago');
  assert.equal(formatAge(5 * H), '5 h ago');
  assert.equal(formatAge(3 * 24 * H), '3 days ago');
  assert.equal(formatAge(42 * 365 * 24 * H), '42 years ago');
  assert.equal(formatAge(null), 'unknown time');
});

const usgsFeature = (id, code, value, time, extra = {}) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-76.7, 39.2] },
  properties: {
    monitoring_location_id: id,
    parameter_code: code,
    value,
    time,
    unit_of_measure: code === '00060' ? 'ft^3/s' : 'ft',
    approval_status: 'Provisional',
    qualifier: null,
    statistic_id: '00011',
    last_modified: time,
    ...extra,
  },
});

test('USGS: groups several measurements per station and keeps provider semantics', () => {
  const stations = normalizeUsgs(
    [
      usgsFeature('USGS-01589100', '00060', '12.5', ago(8 * MIN)),
      usgsFeature('USGS-01589100', '00065', '2.31', ago(8 * MIN)),
    ],
    [
      {
        properties: {
          id: 'USGS-01589100',
          monitoring_location_name: 'PATAPSCO RIVER AT X MD',
          site_type_code: 'ST',
          agency_code: 'USGS',
        },
      },
    ],
    NOW,
  );
  assert.equal(stations.length, 1);
  const s = stations[0];
  assert.equal(s.name, 'PATAPSCO RIVER AT X MD');
  assert.equal(s.waterbody, null); // USGS has no separate waterbody field: stay unknown
  assert.equal(s.sourceUrl, 'https://waterdata.usgs.gov/monitoring-location/01589100/');
  assert.equal(s.measurements.length, 2);
  const flow = s.measurements.find((m) => m.type === 'discharge');
  assert.equal(flow.value, 12.5);
  assert.equal(flow.unit, 'ft^3/s');
  assert.equal(flow.freshness, 'current');
  assert.equal(flow.quality.approval, 'Provisional');
  assert.equal(flow.providerMeta.parameterCode, '00060');
});

test('USGS: stale, qualified, missing-value and unknown-parameter records', () => {
  const stations = normalizeUsgs(
    [
      usgsFeature('USGS-1', '00060', '3', '1984-01-01T00:00:00Z', { qualifier: 'DISCONTINUED' }),
      usgsFeature('USGS-2', '00065', null, ago(MIN)),
      usgsFeature('USGS-3', '00010', '14', ago(MIN)), // temperature: not requested/supported
    ],
    [],
    NOW,
  );
  assert.equal(stations.length, 2);
  const stale = stations.find((s) => s.stationId === 'USGS-1').measurements[0];
  assert.equal(stale.freshness, 'stale');
  assert.deepEqual(stale.quality.qualifiers, ['DISCONTINUED']);
  assert.ok(stale.ageMs > 40 * 365 * 24 * H);
  const missing = stations.find((s) => s.stationId === 'USGS-2').measurements[0];
  assert.equal(missing.value, null);
  assert.equal(missing.observedAt, null);
  assert.equal(missing.freshness, 'none');
  assert.equal(stations.find((s) => s.stationId === 'USGS-1').name, null); // unknown name stays unknown
});

test('USGS: malformed features are skipped, never guessed', () => {
  assert.deepEqual(
    normalizeUsgs(
      [{}, { properties: {} }, usgsFeature('USGS-9', '00060', 'abc', ago(MIN))].slice(0, 2),
      [],
      NOW,
    ),
    [],
  );
  const [s] = normalizeUsgs([usgsFeature('USGS-9', '00060', 'abc', ago(MIN))], [], NOW);
  assert.equal(s.measurements[0].value, null);
});

const eaStation = (extra = {}) => ({
  '@id': 'http://environment.data.gov.uk/flood-monitoring/id/stations/E1',
  stationReference: 'E1',
  label: 'Kingston',
  riverName: 'River Thames',
  lat: 51.41,
  long: -0.31,
  status: 'http://environment.data.gov.uk/flood-monitoring/def/core/statusActive',
  measures: [
    { '@id': 'm-level', parameter: 'level', qualifier: 'Stage', unitName: 'mAOD', period: 900 },
    { '@id': 'm-flow', parameter: 'flow', qualifier: 'Flow', unitName: 'm3/s', period: 900 },
  ],
  ...extra,
});

test('EA: joins readings by measure id; waterbody comes from riverName', () => {
  const readings = indexEaReadings([
    { measure: 'm-level', dateTime: ago(20 * MIN), value: 1.25 },
    { measure: 'm-flow', dateTime: ago(3 * 24 * H), value: 40.2 },
  ]);
  const [s] = normalizeEa([eaStation()], readings, NOW);
  assert.equal(s.waterbody, 'River Thames');
  assert.equal(s.provider, 'ea');
  const level = s.measurements.find((m) => m.type === 'stage');
  assert.equal(level.unit, 'mAOD');
  assert.equal(level.freshness, 'current');
  assert.equal(s.measurements.find((m) => m.type === 'discharge').freshness, 'stale');
  assert.equal(headlineMeasurement(s).type, 'stage'); // freshest leads
});

test('EA: no reading means no value and no observation, never the neighbour measure', () => {
  const [s] = normalizeEa(
    [eaStation()],
    indexEaReadings([{ measure: 'm-level', dateTime: ago(MIN), value: 2 }]),
    NOW,
  );
  const flow = s.measurements.find((m) => m.type === 'discharge');
  assert.equal(flow.value, null);
  assert.equal(flow.freshness, 'none');
});

test('EA: unknown river stays null; groundwater-only and coordinate-less stations are dropped; array values handled', () => {
  const readings = indexEaReadings([{ measure: 'm-level', dateTime: ago(MIN), value: [1.5, 1.6] }]);
  const [s] = normalizeEa([eaStation({ riverName: undefined })], readings, NOW);
  assert.equal(s.waterbody, null);
  assert.equal(s.measurements.find((m) => m.type === 'stage').value, 1.5);
  const gw = eaStation({
    measures: [{ '@id': 'g', parameter: 'level', qualifier: 'Groundwater', unitName: 'mAOD' }],
  });
  assert.equal(normalizeEa([gw, eaStation({ lat: undefined })], new Map(), NOW).length, 0);
});

test('USGS site details: name and type are read as provided, absent fields stay null', () => {
  assert.deepEqual(
    normalizeUsgsSite({
      properties: {
        monitoring_location_name: 'Anacostia River nr Buzzard Point at Washington, DC',
        site_type: 'Tidal stream',
        site_type_code: 'ST-TS',
        state_name: 'District of Columbia',
      },
    }),
    {
      name: 'Anacostia River nr Buzzard Point at Washington, DC',
      siteType: 'Tidal stream',
      siteTypeCode: 'ST-TS',
      state: 'District of Columbia',
      county: null,
    },
  );
  assert.equal(normalizeUsgsSite(null).name, null);
});
