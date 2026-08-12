// Module-level cache for LLM-fetched layer data.
// Deduplicates requests across components — first caller fetches, subsequent
// callers receive the cached result. Prevents double-fetching when both the
// layer component and the DynamicFilterBar call the same hook.
const cache = {};
const inflight = {};

export function getCached(key, fetcher) {
  if (cache[key]) return Promise.resolve(cache[key]);
  if (inflight[key]) return inflight[key];
  inflight[key] = fetcher()
    .then((data) => {
      cache[key] = data;
      delete inflight[key];
      return data;
    })
    .catch((err) => {
      delete inflight[key];
      throw err;
    });
  return inflight[key];
}
