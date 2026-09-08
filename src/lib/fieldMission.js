const EARTH_RADIUS_M = 6_371_000;
export const FIELD_MISSION_CAP = 20;

export const MISSION_PROGRESS = Object.freeze({
  NOT_STARTED: 'NOT STARTED',
  OPENED: 'OPENED',
  ACTION_REQUIRED: 'ACTION REQUIRED',
  COMPLETED: 'COMPLETED',
});

export const FIELD_MISSION_STORAGE_KEY = 'ooh-field-mission-v1';

const priorityRank = { HIGH: 0, MEDIUM: 1, LOW: 2, CURRENT: 3, UNKNOWN: 4 };

export function validMissionCoordinate(value) {
  const lat = Number(value?.lat);
  const lng = Number(value?.lng);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function geodesicDistanceMeters(a, b) {
  if (!validMissionCoordinate(a) || !validMissionCoordinate(b)) return null;
  const lat1 = (Number(a.lat) * Math.PI) / 180;
  const lat2 = (Number(b.lat) * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLng = ((Number(b.lng) - Number(a.lng)) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(Math.min(1, h)));
}

function stableItems(items, cap) {
  const seen = new Set();
  return (Array.isArray(items) ? items : [])
    .filter(
      (item) =>
        item && typeof item.id === 'string' && item.id && !seen.has(item.id) && seen.add(item.id),
    )
    .slice(0, Math.min(FIELD_MISSION_CAP, Math.max(1, Number(cap) || FIELD_MISSION_CAP)));
}

export function orderMissionItems(items, reference = null) {
  const source = stableItems(items, FIELD_MISSION_CAP);
  if (!validMissionCoordinate(reference))
    return source.map((item) => ({ ...item, distance_m: null }));
  const remaining = source.map((item) => ({ ...item, distance_m: null }));
  const ordered = [];
  let from = reference;
  while (remaining.length) {
    remaining.sort((a, b) => {
      const ad = geodesicDistanceMeters(from, a);
      const bd = geodesicDistanceMeters(from, b);
      const aRank = ad == null ? Number.POSITIVE_INFINITY : ad;
      const bRank = bd == null ? Number.POSITIVE_INFINITY : bd;
      return (
        aRank - bRank ||
        (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) ||
        a.id.localeCompare(b.id)
      );
    });
    const next = remaining.shift();
    next.distance_m = geodesicDistanceMeters(from, next);
    ordered.push(next);
    if (validMissionCoordinate(next)) from = next;
  }
  return ordered;
}

export function createFieldMission(
  items,
  { reference = null, cap = FIELD_MISSION_CAP, progress = {} } = {},
) {
  const selected = stableItems(items, cap);
  return {
    version: 1,
    cap: Math.min(FIELD_MISSION_CAP, Math.max(1, Number(cap) || FIELD_MISSION_CAP)),
    reference: validMissionCoordinate(reference)
      ? { lat: Number(reference.lat), lng: Number(reference.lng) }
      : null,
    ordering: validMissionCoordinate(reference)
      ? 'NEAREST NEXT BY STRAIGHT-LINE DISTANCE'
      : 'PRIORITY THEN LOCATION ID',
    progress: { ...(progress || {}) },
    items: orderMissionItems(selected, reference),
  };
}

export function missionProgress(value) {
  return Object.values(MISSION_PROGRESS).includes(value) ? value : MISSION_PROGRESS.NOT_STARTED;
}

export function missionItemProgress(mission, id) {
  return missionProgress(mission?.progress?.[id]);
}

export function updateMissionProgress(mission, id, value) {
  if (!mission?.items?.some((item) => item.id === id)) return mission;
  return {
    ...mission,
    progress: {
      ...(mission.progress || {}),
      [id]: missionProgress(value),
    },
  };
}

export function loadFieldMission() {
  try {
    return JSON.parse(sessionStorage.getItem(FIELD_MISSION_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function addToFieldMission(item) {
  if (!item || typeof item.id !== 'string') return { ok: false, reason: 'INVALID_LOCATION' };
  const current = loadFieldMission();
  const items = current?.items || [];
  if (items.some((entry) => entry.id === item.id))
    return { ok: true, mission: current, added: false };
  if (items.length >= FIELD_MISSION_CAP) return { ok: false, reason: 'MISSION_CAP' };
  const mission = createFieldMission([...items, item], {
    reference: current?.reference || null,
    cap: current?.cap || FIELD_MISSION_CAP,
    progress: current?.progress || {},
  });
  try {
    sessionStorage.setItem(FIELD_MISSION_STORAGE_KEY, JSON.stringify(mission));
  } catch {
    return { ok: false, reason: 'SESSION_UNAVAILABLE' };
  }
  return { ok: true, mission, added: true };
}
