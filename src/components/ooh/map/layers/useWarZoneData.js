// Conflict-zone layer data hook (unavailable).
// Generation removed: this hook used to ask an LLM (with web search) for conflict zones and returned the
// model's coordinates as if they were observations. It now makes no request and reports the
// layer as unavailable (see unsupportedLayers.js). Counts must not be derived from it.
const EMPTY = Object.freeze([]);

export function useWarZoneData() {
  return { zones: EMPTY, loading: false, unavailable: true };
}
