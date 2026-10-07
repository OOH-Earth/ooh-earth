// Pure, dependency-free core of useAuthGatedSubscribe.js's gating logic --
// no React, no SDK, no path aliases -- so it can be unit-tested directly
// with `node --test`, matching this repo's convention for small pure
// modules (see withRetry.js/dedupeInFlight.js). See
// useAuthGatedSubscribe.js for how these are wired into a hook, and
// authGatedSubscribeCore.test.mjs for the tests.

export function shouldOpenSubscription(authChecked, isAuthenticated, entityName) {
  // Pass a falsy `entityName` (e.g. before a required prop like `location`
  // has resolved) to skip subscribing entirely, matching how call sites
  // already guarded their raw `.subscribe()` calls. Auth status still
  // resolving (`!authChecked`): don't attempt a subscription that would
  // currently be anonymous and get rejected -- wait for it to settle.
  return Boolean(entityName) && Boolean(authChecked) && Boolean(isAuthenticated);
}

export function subscribeToEntity(entities, entityName, callback) {
  const entity = entities?.[entityName];
  if (!entity?.subscribe) return () => {};
  const unsub = entity.subscribe(callback);
  return typeof unsub === 'function' ? unsub : () => {};
}
