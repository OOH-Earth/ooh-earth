const normalizeLng = (value) => ((((value + 180) % 360) + 360) % 360) - 180;

export function buildViewportLocationQueries({ n, s, e, w }) {
  const north = Math.min(90, Number(n));
  const south = Math.max(-90, Number(s));
  const rawEast = Number(e);
  const rawWest = Number(w);
  if (![north, south, rawEast, rawWest].every(Number.isFinite) || north < south) return [];

  const latitude = { $gte: south, $lte: north };
  const east = normalizeLng(rawEast);
  const west = normalizeLng(rawWest);
  const longitudeSpan = Math.abs(rawEast - rawWest);
  if (longitudeSpan >= 359) return [{ lat: latitude }];
  if (west <= east) return [{ lat: latitude, lng: { $gte: west, $lte: east } }];

  // Base44 rejects Mongo's `$or` operator. Split dateline-crossing viewports
  // into two bounded queries instead.
  return [
    { lat: latitude, lng: { $gte: west } },
    { lat: latitude, lng: { $lte: east } },
  ];
}
