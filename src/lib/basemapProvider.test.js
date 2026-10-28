import test from 'node:test';
import assert from 'node:assert/strict';
import { getCartoKey, withCartoKey, resolveReportBasemap } from './basemapProvider.js';

test('withCartoKey: only CARTO raster URLs, only when a key exists, key is URL-encoded', () => {
  const dark = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  assert.equal(withCartoKey(dark, ''), dark);
  assert.equal(withCartoKey(dark, ' abc&1 '.trim()), `${dark}?key=abc%261`);
  assert.equal(withCartoKey(`${dark}?x=1`, 'k'), `${dark}?x=1&key=k`);
  const esri =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  assert.equal(withCartoKey(esri, 'k'), esri);
  assert.equal(
    withCartoKey('https://a.basemaps.cartocdn.com.evil.test/x.png', 'k'),
    'https://a.basemaps.cartocdn.com.evil.test/x.png',
  );
});

test('getCartoKey trims and ignores non-strings', () => {
  assert.equal(getCartoKey('  k  '), 'k');
  assert.equal(getCartoKey(undefined), '');
  assert.equal(getCartoKey(42), '');
});

test('report basemap: no key and no opt-in requests no tiles at all', () => {
  for (const cartoKey of [undefined, '', '  ']) {
    assert.deepEqual(resolveReportBasemap({ cartoKey, fallback: undefined }), {
      status: 'unconfigured',
    });
    assert.deepEqual(resolveReportBasemap({ cartoKey, fallback: 'carto' }), {
      status: 'unconfigured',
    });
  }
});

test('report basemap: key wins over the fallback and carries CARTO + OSM attribution', () => {
  const b = resolveReportBasemap({ cartoKey: 'k', fallback: 'esri' });
  assert.equal(b.status, 'carto');
  assert.ok(b.url.endsWith('{r}.png?key=k'));
  assert.match(b.attribution, /OpenStreetMap contributors/);
  assert.match(b.attribution, /CARTO/);
});

test('report basemap: Esri only on explicit opt-in, with the service credit text', () => {
  const b = resolveReportBasemap({ cartoKey: '', fallback: 'esri' });
  assert.equal(b.status, 'esri-fallback');
  assert.ok(b.url.startsWith('https://server.arcgisonline.com/'));
  assert.match(b.attribution, /Esri, Vantor, Earthstar Geographics/);
});
