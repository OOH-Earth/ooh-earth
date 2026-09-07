const EARTH_RADIUS_KM = 6371;

export function isValidCoordinate(point) {
  const latitude = Number(point?.lat);
  const longitude = Number(point?.lng);
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function geodesicDistanceKm(first, second) {
  if (!isValidCoordinate(first) || !isValidCoordinate(second)) return null;

  const toRadians = (value) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(Number(second.lat) - Number(first.lat));
  const longitudeDelta = toRadians(Number(second.lng) - Number(first.lng));
  const firstLatitude = toRadians(Number(first.lat));
  const secondLatitude = toRadians(Number(second.lat));
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.sin(longitudeDelta / 2) ** 2 * Math.cos(firstLatitude) * Math.cos(secondLatitude);

  return (
    Math.round(
      EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)) * 10,
    ) / 10
  );
}

export function deriveLogisticsEvidence(fields = {}, contextPoint = null) {
  const origin = fields.origins;
  const manufacturing = fields.manufacturing_places;
  const evidencedPoint = origin?.coordinates || manufacturing?.coordinates || null;
  const distanceKm = geodesicDistanceKm(evidencedPoint, contextPoint);

  return {
    declaredOrigin: origin?.value ?? null,
    declaredOriginEvidence: origin?.evidence_class || 'UNKNOWN',
    manufacturingPlace: manufacturing?.value ?? null,
    manufacturingEvidence: manufacturing?.evidence_class || 'UNKNOWN',
    distanceKm,
    distanceSource:
      distanceKm == null
        ? null
        : origin?.coordinates
          ? 'declared origin'
          : 'declared manufacturing place',
    route: null,
    mode: null,
    factory: null,
  };
}
