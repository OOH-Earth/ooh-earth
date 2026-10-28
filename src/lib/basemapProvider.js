// Basemap provider configuration (raster tiles).
//
// CARTO's free basemaps (basemaps.cartocdn.com) require a `key` query parameter
// (https://carto.com/basemaps/apikey, terms dated 2026-09-29). Without one every raster tile is an
// HTTP 200 PNG with "API KEY REQUIRED" painted into it, and an invalid or expired key returns the
// same bytes, so neither case can be detected from the response. The key is therefore applied by
// explicit configuration only, and nothing here tries to detect a watermark.
//
// VITE_* values are bundled into the page and readable by anyone: use only a CARTO key that was
// issued for browser use and restricted to our domains in CARTO's dashboard, never a privileged or
// server-side key.

const CARTO_RASTER = /^https:\/\/(\{s\}|[a-d])\.basemaps\.cartocdn\.com\//;

// Vite injects import.meta.env at build time; node:test has none, hence the optional chain.
const env = () => /** @type {any} */ (import.meta).env ?? {};

export function getCartoKey(raw = env().VITE_CARTO_BASEMAPS_KEY) {
  return typeof raw === 'string' ? raw.trim() : '';
}

/** Append the configured CARTO key to a CARTO raster URL. Other URLs, or no key: unchanged. */
export function withCartoKey(url, key = getCartoKey()) {
  if (!key || !CARTO_RASTER.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(key)}`;
}

const CARTO_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
// Esri World Imagery, the keyless endpoint (service credit text copied from its REST page).
// Using it for the Report picker needs owner confirmation of Esri's terms, so it is opt-in.
const ESRI_IMAGERY =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

/**
 * Report pin picker basemap.
 *  - status 'carto':        a CARTO key is configured.
 *  - status 'esri-fallback': no key, and the owner opted in with VITE_REPORT_BASEMAP_FALLBACK=esri.
 *  - status 'unconfigured':  neither: no tiles are requested and the UI says so.
 */
export function resolveReportBasemap({
  cartoKey = getCartoKey(),
  fallback = env().VITE_REPORT_BASEMAP_FALLBACK,
} = {}) {
  const key = typeof cartoKey === 'string' ? cartoKey.trim() : '';
  if (key) {
    return {
      status: 'carto',
      url: withCartoKey(CARTO_DARK, key),
      subdomains: 'abcd',
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap contributors, &copy; CARTO',
    };
  }
  if (fallback === 'esri') {
    return {
      status: 'esri-fallback',
      url: ESRI_IMAGERY,
      subdomains: 'abc',
      maxZoom: 19,
      attribution: 'Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community',
    };
  }
  return { status: 'unconfigured' };
}
