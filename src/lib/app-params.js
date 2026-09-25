// @ts-nocheck -- intentionally excluded from typecheck (jsconfig.json), see TECHNICAL_DEBT_REGISTER.md
const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

// The production app id is public routing configuration, not a credential.
// Keep it as the last-resort build fallback so a custom-domain/PWA build does
// not boot the SDK with a null app id when the hosting environment omitted the
// Vite variable. A BACKUP build still supplies its own VITE_BASE44_APP_ID.
const LIVE_APP_ID = '6a62213cff3ccbca88c04ff5';

const toSnakeCase = (str) => {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
};

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
  if (isNode) {
    return defaultValue;
  }
  const storageKey = `base44_${toSnakeCase(paramName)}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);
  if (removeFromUrl) {
    urlParams.delete(paramName);
    const newUrl = `${window.location.pathname}${
      urlParams.toString() ? `?${urlParams.toString()}` : ''
    }${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }
  if (searchParam) {
    storage.setItem(storageKey, searchParam);
    return searchParam;
  }
  if (defaultValue) {
    storage.setItem(storageKey, defaultValue);
    return defaultValue;
  }
  const storedValue = storage.getItem(storageKey);
  if (storedValue) {
    return storedValue;
  }
  return null;
};

const getAppParams = () => {
  if (getAppParamValue('clear_access_token') === 'true') {
    storage.removeItem('base44_access_token');
    storage.removeItem('token');
  }
  return {
    // App identity must come from the build, never from a query string or a
    // persisted value. This prevents a stale installed-PWA bootstrap (or a
    // crafted URL) from switching the SDK to a different/nonexistent app.
    appId: import.meta.env.VITE_BASE44_APP_ID || LIVE_APP_ID,
    token: getAppParamValue('access_token', { removeFromUrl: true }),
    fromUrl: getAppParamValue('from_url', { defaultValue: window.location.href }),
    functionsVersion: getAppParamValue('functions_version', {
      defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION,
    }),
    // Keep auth callbacks on the same origin as the app. Base44 custom
    // domains expose the API and auth endpoints there; this also avoids an
    // installed-PWA callback crossing origins and losing cookie state.
    appBaseUrl:
      import.meta.env.VITE_BASE44_APP_BASE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : ''),
  };
};

export const appParams = {
  ...getAppParams(),
};

// Same storage keys the `clear_access_token=true` branch above already
// clears. A rejected/expired token must be removed here too -- otherwise it
// stays in storage and every subsequent page load (including /login itself)
// keeps retrying the same dead credential, redirecting again each time.
export const clearAccessToken = () => {
  storage.removeItem('base44_access_token');
  storage.removeItem('token');
};
