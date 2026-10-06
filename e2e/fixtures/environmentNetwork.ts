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

type Line = { cls: 'river' | 'canal'; from: [number, number]; to: [number, number] };

function lineFeature(line: Line): number[] {
  const tags = line.cls === 'river' ? [0, 0, 1, 1] : [0, 2];
  const geometry = [
    9,
    zig(line.from[0]),
    zig(line.from[1]),
    10,
    zig(line.to[0] - line.from[0]),
    zig(line.to[1] - line.from[1]),
  ];
  return [
    ...lenDelim(2, tags),
    ...key(3, 0),
    ...varint(2), // packed uint32: every element must be varint-encoded, not pushed as a raw byte
    ...lenDelim(4, geometry.flatMap(varint)),
  ];
}

export function waterwayTile(lines: Line[]): Buffer {
  const layer = [
    ...key(15, 0),
    ...varint(2),
    ...lenDelim(1, str('waterway')),
    ...lines.flatMap((l) => lenDelim(2, lineFeature(l))),
    ...lenDelim(3, str('class')),
    ...lenDelim(3, str('name')),
    ...lenDelim(4, lenDelim(1, str('river'))),
    ...lenDelim(4, lenDelim(1, str('Fixture River'))),
    ...lenDelim(4, lenDelim(1, str('canal'))),
    ...key(5, 0),
    ...varint(4096),
  ];
  return Buffer.from(lenDelim(3, layer));
}

// Dense grid so a click near the centre of any tile reliably lands on a feature.
export function gridTile(spacing = 128): Buffer {
  const lines: Line[] = [];
  for (let i = 0; i <= 4096; i += spacing) {
    lines.push({ cls: 'river', from: [i, 0], to: [i, 4096] });
    lines.push({ cls: 'river', from: [0, i], to: [4096, i] });
  }
  return waterwayTile(lines);
}
export const emptyTile = (): Buffer => waterwayTile([]);

export type NetworkMode = 'grid' | 'empty' | 'tilejson-fails' | 'tiles-fail' | 'tiles-fail-detail';

export async function stubEnvironmentNetwork(page: Page, mode: NetworkMode = 'grid') {
  const tileRequests: { z: number; x: number; y: number }[] = [];
  const stats = { tilejson: 0, style: 0 };
  const grid = gridTile();
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
