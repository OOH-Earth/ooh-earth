const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'landing_path'];
const STORAGE_KEY = 'ooh_attribution_v1';

const read = (storage) => {
  try {
    const value = storage?.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

export const getSessionAttribution = (location = typeof window !== 'undefined' ? window.location : null, storageOverride) => {
  if (!location) return {};
  const storage = storageOverride || (typeof sessionStorage !== 'undefined' ? sessionStorage : null);
  const existing = read(storage);
  const params = new URLSearchParams(location.search || '');
  const next = { ...existing };
  for (const key of KEYS.slice(0, -1)) {
    const value = params.get(key);
    if (!existing[key] && value && value.length <= 120) next[key] = value;
  }
  if (!existing.landing_path) next.landing_path = location.pathname || '/';
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* optional storage */ }
  return Object.fromEntries(KEYS.filter(key => next[key]).map(key => [key, next[key]]));
};

export const markQualifiedVisit = (storage = typeof sessionStorage !== 'undefined' ? sessionStorage : null) => {
  if (!storage) return false;
  try {
    if (storage?.getItem('ooh_qualified_visit_v1')) return false;
    storage.setItem('ooh_qualified_visit_v1', '1');
  } catch { /* optional storage */ }
  return true;
};
