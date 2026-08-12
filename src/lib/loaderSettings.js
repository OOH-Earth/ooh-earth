import { base44 } from '@/api/base44Client';

// Admin-controlled loading-screen style (persisted in the SiteSetting entity).
//   "matrix" = digital-rain boot/page loader   ·   "off" = minimal spinner
// More styles can be added to LOADER_STYLES later. The loader component reads the
// value synchronously at render time, so we keep a localStorage mirror that is
// hydrated from the DB on boot (see hydrateLoaderStyle, called from App).
export const LOADER_SETTING_KEY = 'loader_style';
export const LOADER_DEFAULT = 'matrix';
export const LOADER_STYLES = ['matrix', 'off'];
const CACHE_KEY = 'ooh-loader-style';

export async function fetchLoaderStyle() {
  try {
    const rows = await base44.entities.SiteSetting.filter({ key: LOADER_SETTING_KEY });
    const rec = rows?.[0];
    if (rec?.value) return rec.value.trim();
  } catch {
    /* not configured / offline */
  }
  return null;
}

export function readCachedLoaderStyle() {
  try {
    return localStorage.getItem(CACHE_KEY) || null;
  } catch {
    return null;
  }
}

export function writeLoaderCache(style) {
  try {
    if (style) localStorage.setItem(CACHE_KEY, style);
  } catch {
    /* private mode */
  }
}

// Synchronous — safe at render time. Defaults to matrix ON.
export function matrixLoaderEnabled() {
  return (readCachedLoaderStyle() || LOADER_DEFAULT) !== 'off';
}

// Hydrate the localStorage mirror from the DB. Call once on boot so an admin's
// change propagates to every visitor on their next load.
export async function hydrateLoaderStyle() {
  const s = await fetchLoaderStyle();
  writeLoaderCache(s || LOADER_DEFAULT);
  return s || LOADER_DEFAULT;
}
