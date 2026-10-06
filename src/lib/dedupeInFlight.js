// Shares one in-flight async call across callers with the same key. Entries
// clear on both success and failure, so a deliberate retry can start fresh.
export function createDedupeInFlight() {
  const inFlight = new Map();
  return function dedupe(key, fn) {
    const existing = inFlight.get(key);
    if (existing) return existing;
    const promise = fn();
    inFlight.set(key, promise);
    promise
      .finally(() => {
        if (inFlight.get(key) === promise) inFlight.delete(key);
      })
      .catch(() => {});
    return promise;
  };
}
