import type { Page } from '@playwright/test';

// Deterministic stand-in for the CARTO vector tile network the environment maps use. Regression
// tests must not depend on third-party services; real-network QA is done separately.

// Exact-hostname matching (not URL regexes) so only the intended third-party hosts are stubbed.
const isHost = (url: URL, host: string) =>
  url.hostname === host || url.hostname.endsWith(`.${host}`);
const isStyle = (url: URL) =>
  isHost(url, 'basemaps.cartocdn.com') && /^\/gl\/.*style\.json$/.test(url.pathname);
const TILEJSON_URL = /\/vector\/carto\.streets\/v1\/tiles\.json/;
const TILE_URL = /\/vectortiles\/carto\.streets\/v1\/(\d+)\/(\d+)\/(\d+)\.mvt/;
const TILE_TEMPLATE =
  'https://tiles-a.basemaps.cartocdn.com/vectortiles/carto.streets/v1/{z}/{x}/{y}.mvt';

// ---- minimal Mapbox Vector Tile encoder (protobuf) ----
const varint = (n: number): number[] => {
  const out: number[] = [];
  let v = n >>> 0;
  while (v > 127) {
    out.push((v & 127) | 128);
    v >>>= 7;
  }
  out.push(v);
  return out;
};
const key = (field: number, wire: number) => varint((field << 3) | wire);
const lenDelim = (field: number, bytes: number[]) => [
  ...key(field, 2),
  ...varint(bytes.length),
  ...bytes,
];
const str = (s: string) => Array.from(Buffer.from(s, 'utf8'));
const zig = (n: number) => (n << 1) ^ (n >> 31);

type Prop = string | boolean;
type Feat = {
  type: 'line' | 'polygon';
  pts: [number, number][];
  props: Record<string, Prop>;
};

function geometryFor(f: Feat): number[] {
  const [first, ...rest] = f.pts;
  const g = [9, zig(first[0]), zig(first[1])];
  g.push(2 | (rest.length << 3));
  let prev = first;
  for (const p of rest) {
    g.push(zig(p[0] - prev[0]), zig(p[1] - prev[1]));
    prev = p;
  }
  if (f.type === 'polygon') g.push(15); // ClosePath
  return g;
}

function layerBytes(name: string, feats: Feat[]): number[] {
  const keys: string[] = [];
  const values: Prop[] = [];
  const idx = (arr: (string | Prop)[], v: string | Prop) => {
    let i = arr.indexOf(v);
    if (i < 0) {
      arr.push(v);
      i = arr.length - 1;
    }
    return i;
  };
  const featureBytes = feats.map((f) => {
    const tags = Object.entries(f.props).flatMap(([k, v]) => [idx(keys, k), idx(values, v)]);
    return lenDelim(2, [
      ...lenDelim(2, tags.flatMap(varint)),
      ...key(3, 0),
      ...varint(f.type === 'line' ? 2 : 3),
      ...lenDelim(4, geometryFor(f).flatMap(varint)),
    ]);
  });
  const valueBytes = values.map((v) =>
    lenDelim(
      4,
      typeof v === 'boolean' ? [...key(7, 0), ...varint(v ? 1 : 0)] : lenDelim(1, str(v)),
    ),
  );
  return [
    ...key(15, 0),
    ...varint(2),
    ...lenDelim(1, str(name)),
    ...featureBytes.flat(),
    ...keys.flatMap((k) => lenDelim(3, str(k))),
    ...valueBytes.flat(),
    ...key(5, 0),
    ...varint(4096),
  ];
}

export function buildTile(layers: Record<string, Feat[]>): Buffer {
  return Buffer.from(
    Object.entries(layers).flatMap(([name, feats]) => lenDelim(3, layerBytes(name, feats))),
  );
}

// Dense grid so a click near the centre of any tile reliably lands on a feature.
function gridLines(spacing: number): Feat[] {
  const lines: Feat[] = [];
  for (let i = 0; i <= 4096; i += spacing) {
    const props = { class: 'river', name: 'Fixture River' };
    lines.push({
      type: 'line',
      pts: [
        [i, 0],
        [i, 4096],
      ],
      props,
    });
    lines.push({
      type: 'line',
      pts: [
        [0, i],
        [4096, i],
      ],
      props,
    });
  }
  return lines;
}
const square: [number, number][] = [
  [256, 256],
  [3840, 256],
  [3840, 3840],
  [256, 3840],
];

export const gridTile = (spacing = 128): Buffer => buildTile({ waterway: gridLines(spacing) });
export const emptyTile = (): Buffer => buildTile({ waterway: [] });
// Reference polygons covering most of every tile: water, natural cover and a protected area.
export const ecologyTile = (): Buffer =>
  buildTile({
    water: [{ type: 'polygon', pts: square, props: { class: 'lake', intermittent: false } }],
    landcover: [{ type: 'polygon', pts: square, props: { class: 'wood', subclass: 'forest' } }],
    park: [
      {
        type: 'polygon',
        pts: square,
        props: { class: 'nature_reserve', name: 'Fixture Reserve', name_en: 'Fixture Reserve' },
      },
    ],
  });

export type NetworkMode =
  'grid' | 'ecology' | 'empty' | 'tilejson-fails' | 'tiles-fail' | 'tiles-fail-detail';

export async function stubEnvironmentNetwork(page: Page, mode: NetworkMode = 'grid') {
  const tileRequests: { z: number; x: number; y: number }[] = [];
  const stats = { tilejson: 0, style: 0 };
  const grid = mode === 'ecology' ? ecologyTile() : gridTile();
  const empty = emptyTile();

  await page.route(isStyle, (route) => {
    stats.style += 1;
    return route.fulfill({
      json: {
        version: 8,
        name: 'env-test-style',
        sources: {
          carto: {
            type: 'vector',
            url: 'https://tiles.basemaps.cartocdn.com/vector/carto.streets/v1/tiles.json',
          },
        },
        layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#05070a' } }],
      },
    });
  });
  await page.route(TILEJSON_URL, (route) => {
    stats.tilejson += 1;
    if (mode === 'tilejson-fails') return route.abort('failed');
    return route.fulfill({
      json: {
        tilejson: '2.2.0',
        tiles: [TILE_TEMPLATE],
        minzoom: 0,
        maxzoom: 14,
        attribution: '© CARTO © OpenStreetMap contributors',
        vector_layers: [{ id: 'waterway', fields: { class: 'String', name: 'String' } }],
      },
    });
  });
  await page.route(TILE_URL, (route) => {
    const m = TILE_URL.exec(route.request().url())!;
    tileRequests.push({ z: Number(m[1]), x: Number(m[2]), y: Number(m[3]) });
    if (mode === 'tiles-fail') return route.fulfill({ status: 500, body: 'nope' });
    // Zoom-5 tiles work, closer detail tiles fail: a genuine partial failure.
    if (mode === 'tiles-fail-detail' && Number(m[1]) >= 6) {
      return route.fulfill({ status: 500, body: 'nope' });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/x-protobuf',
      body: mode === 'empty' ? empty : grid,
    });
  });
  // Anything else third-party on the map path is out of scope for these tests.
  await page.route(
    (url) =>
      (isHost(url, 'basemaps.cartocdn.com') && url.pathname.startsWith('/fonts')) ||
      isHost(url, 'arcgisonline.com'),
    (route) => route.fulfill({ status: 204 }),
  );
  return { tileRequests, stats };
}

// ---- iNaturalist + Open-Meteo stand-ins for the Ecology page ----
export type ApiMode = 'ok' | 'empty' | 'error';

const isoDaysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);

export const INAT_FIXTURE = {
  plants: [
    {
      uuid: 'p1',
      name: 'Calotropis gigantea',
      common: 'crown flower',
      days: 3,
      lng: 100.52,
      lat: 13.77,
      obscured: false,
      license: 'cc-by',
    },
    {
      uuid: 'p2',
      name: 'Mimosa pudica',
      common: 'sensitive plant',
      days: 10,
      lng: 100.48,
      lat: 13.72,
      obscured: false,
      license: 'cc-by-nc',
    },
    {
      uuid: 'p3',
      name: 'Paphiopedilum rarum',
      common: 'rare orchid',
      days: 5,
      lng: 100.5,
      lat: 13.75,
      obscured: true,
      license: null,
    },
  ],
  fungi: [
    {
      uuid: 'f1',
      name: 'Trametes versicolor',
      common: 'turkey tail',
      days: 2,
      lng: 100.51,
      lat: 13.74,
      obscured: false,
      license: 'cc-by',
    },
  ],
};

export async function stubEcologyApis(
  page: Page,
  opts: { inat?: ApiMode; weather?: ApiMode } = {},
) {
  const inatMode = opts.inat ?? 'ok';
  const weatherMode = opts.weather ?? 'ok';
  const inatRequests: URL[] = [];
  const weatherRequests: URL[] = [];
  const stats = { llmCalls: 0 };

  await page.route(
    (url) => url.hostname === 'api.inaturalist.org' && url.pathname === '/v2/observations',
    (route) => {
      const url = new URL(route.request().url());
      inatRequests.push(url);
      if (inatMode === 'error') return route.fulfill({ status: 500, body: 'nope' });
      const group = url.searchParams.get('iconic_taxa') === 'Plantae' ? 'plants' : 'fungi';
      const rows = inatMode === 'empty' ? [] : INAT_FIXTURE[group as 'plants' | 'fungi'];
      return route.fulfill({
        json: {
          total_results: inatMode === 'empty' ? 0 : group === 'plants' ? 57 : 9,
          results: rows.map((r) => ({
            uuid: r.uuid,
            observed_on: isoDaysAgo(r.days),
            geojson: { type: 'Point', coordinates: [r.lng, r.lat] },
            uri: `https://www.inaturalist.org/observations/${r.uuid}`,
            license_code: r.license,
            obscured: r.obscured,
            taxon: { name: r.name, preferred_common_name: r.common },
          })),
        },
      });
    },
  );
  await page.route(
    (url) =>
      url.hostname === 'air-quality-api.open-meteo.com' || url.hostname === 'api.open-meteo.com',
    (route) => {
      const url = new URL(route.request().url());
      weatherRequests.push(url);
      if (weatherMode === 'error') return route.fulfill({ status: 500, body: 'nope' });
      const aq = url.hostname.startsWith('air-quality');
      return route.fulfill({
        json: {
          latitude: Number(url.searchParams.get('latitude')),
          longitude: Number(url.searchParams.get('longitude')),
          current: aq
            ? { time: '2026-10-06T18:00', interval: 3600, pm2_5: 16.9, pm10: 19.2, us_aqi: 76 }
            : {
                time: '2026-10-06T18:00',
                interval: 900,
                temperature_2m: 24.3,
                relative_humidity_2m: 98,
                precipitation: 0.1,
                wind_speed_10m: 3.2,
              },
        },
      });
    },
  );
  // The old Ecology page invoked a paid LLM for its "hotspots". Count any attempt.
  await page.route(
    (url) => url.pathname.endsWith('/integration-endpoints/Core/InvokeLLM'),
    (route) => {
      if (/hotspot/i.test(route.request().postData() || '')) stats.llmCalls += 1;
      return route.fulfill({ json: {} });
    },
  );
  return { inatRequests, weatherRequests, stats };
}
