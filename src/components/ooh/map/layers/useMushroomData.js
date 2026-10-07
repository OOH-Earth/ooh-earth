// No sourced observations are wired to this legacy Main Map layer yet.
// Keep the consumer contract stable without requesting or plotting model-written coordinates.
// Ecology observations remain available on /ecology; conflict data needs a licensed source.
const unavailable = { spots: [], loading: false };

export function useMushroomData(_enabled = true) {
  return unavailable;
}
