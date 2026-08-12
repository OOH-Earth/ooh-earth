import { base44 } from '@/api/base44Client';

// Single source of truth for theme ids, the site default, and the
// admin-controlled enabled list (persisted in the SiteSetting entity).
export const THEME_ORDER = ['dark', 'light', 'matrix', 'beta', 'crafty', 'guild'];
export const THEME_DEFAULT = 'matrix';
export const SETTING_KEY = 'themes_enabled';

const CACHE_KEY = 'ooh-themes-cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 min

// null/undefined return from fetchEnabledThemes = "not configured" → all on.
export async function fetchEnabledThemes() {
  try {
    const rows = await base44.entities.SiteSetting.filter({ key: SETTING_KEY });
    const rec = rows?.[0];
    if (rec?.value) {
      return rec.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  } catch {}
  return null;
}

export function readCachedThemes() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { value, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return value;
  } catch {
    return null;
  }
}

export function writeThemeCache(value) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ value, ts: Date.now() }));
  } catch {}
}

export function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle('light', theme === 'light');
  root.classList.toggle('matrix', theme === 'matrix');
  root.classList.toggle('beta', theme === 'beta');
  root.classList.toggle('crafty', theme === 'crafty');
  root.classList.toggle('guild', theme === 'guild');
}

// Site default with graceful fallback if matrix is disabled by admin.
export function resolveDefault(enabledList) {
  if (enabledList?.includes('matrix')) return 'matrix';
  if (enabledList?.length) return enabledList[0];
  return 'dark';
}
