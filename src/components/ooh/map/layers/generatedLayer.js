// These three layers (mushroom foraging, flora, conflict zones) are produced by a language model
// with web context, not by observations. The model chooses the coordinates, species and, for
// conflict zones, the "source". Nothing verifies them. They are therefore labelled everywhere they
// appear, and they are only requested when the layer is switched on.
export const GENERATED_BADGE = 'AI-generated · unverified';
export const GENERATED_NOTE =
  'AI-generated suggestion. Coordinates and details are not verified and this is not an observation.';
export const GENERATED_NOTE_ECOLOGY = `${GENERATED_NOTE} Dated, verifiable records: Ecology (iNaturalist).`;
export const GENERATED_NOTE_WAR = `${GENERATED_NOTE} The source named below was chosen by the model and is not verified.`;
