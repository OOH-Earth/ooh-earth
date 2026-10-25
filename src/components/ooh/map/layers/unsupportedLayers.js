// Map layers whose data used to be generated on every page load by an LLM web search
// (InvokeLLM + add_context_from_internet): mushroom/flora hotspots and conflict zones, with
// model-written coordinates, severities and "sources". Nothing in the app verified those
// claims, so the layers are switched off rather than cached, relabelled or made opt-in.
// Re-enable a layer only by wiring it to a sourced dataset with provenance and dates.
export const UNSUPPORTED_LAYER_IDS = Object.freeze(['mushrooms', 'flora', 'war']);

export const UNSUPPORTED_LAYER_NOTE =
  'Unavailable: this layer used AI-generated locations that were not verified against a source. It is switched off until a sourced dataset is added.';

export const isUnsupportedLayer = (id) => UNSUPPORTED_LAYER_IDS.includes(id);

// Persisted layer selections from earlier sessions may still contain removed layer ids.
export function withoutUnsupportedLayers(ids) {
  return Array.isArray(ids) ? ids.filter((id) => !isUnsupportedLayer(id)) : ids;
}
