// Shares one in-flight async call across concurrent callers that pass the
// same key, instead of each starting its own. Extracted as its own module
// so it can be unit tested without a real Base44 SDK client -- see
// dedupeInFlight.test.mjs and the usage in src/api/base44Client.js (fixes
// the ~8-16x duplicate concurrent Location fetches that fire whenever
// Home's many independent widgets mount together).
//
// Returns a memoized dedupe(key, fn) function. Concurrent calls with the
// same key share one promise; once it settles (success OR failure), the
// entry clears, so the next call -- even moments later -- starts a fresh
// attempt rather than replaying a stale result forever.
export function createDedupeInFlight() {
  const inFlight = new Map();
  return function dedupe(key, fn) {
    const existing = inFlight.get(key);
    if (existing) return existing;
    const promise = fn();
    inFlight.set(key, promise);
    // .finally() returns its own derived promise that also rejects when
    // `promise` does; nothing else observes that derived promise, so it
    // must be given its own no-op .catch() or a rejection here becomes an
    // unhandled rejection. The original `promise` returned below is
    // untouched and still rejects normally for real callers.
    promise.finally(() => {
      if (inFlight.get(key) === promise) inFlight.delete(key);
    }).catch(() => {});
    return promise;
  };
}
