import { freshnessOf } from './locationQuality.js';
import { detectChanges } from './fieldCheckFreshness.js';

export const EVIDENCE_TIMELINE_CAP = 50;

const safeDate = (value) =>
  typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;

function event({
  id,
  kind,
  what,
  at,
  evidenceClass,
  source,
  freshness,
  status = null,
  imageUrl = null,
}) {
  return {
    id,
    kind,
    what,
    at: safeDate(at),
    evidence_class: evidenceClass,
    source,
    freshness: freshness || 'UNKNOWN',
    status: status || null,
    image_url: imageUrl,
  };
}

/**
 * Build a bounded, display-safe memory of evidence already authorized for a
 * Location. Rejected rows remain visible as moderation state, but rejected or
 * pending media is never promoted into the photo evidence stream.
 * @param {{ location?: any, fieldChecks?: any[], locationPhotos?: any[], now?: number, cap?: number }} options
 */
export function buildEvidenceTimeline({
  location,
  fieldChecks = [],
  locationPhotos = [],
  now = Date.now(),
  cap = EVIDENCE_TIMELINE_CAP,
} = {}) {
  const freshness = (at) => (at ? freshnessOf(at, now) : 'UNKNOWN');
  const events = [];
  if (location?.id) {
    events.push(
      event({
        id: `${location.id}:created`,
        kind: 'LOCATION_CREATED',
        what: 'Location created',
        at: location.created_date,
        evidenceClass: 'REPORTED',
        source: 'OOH Earth Location record',
        freshness: freshness(location.created_date),
      }),
    );
    if (location.status_updated_at) {
      events.push(
        event({
          id: `${location.id}:status`,
          kind: 'VERIFICATION_STATE',
          what: `Moderation state: ${String(location.status || 'UNKNOWN').toUpperCase()}`,
          at: location.status_updated_at,
          evidenceClass: 'REPORTED',
          source: 'OOH Earth moderation state',
          freshness: freshness(location.status_updated_at),
          status: location.status,
        }),
      );
    }
    if (location.image_url) {
      events.push(
        event({
          id: `${location.id}:cover`,
          kind: 'PHOTO_EVIDENCE',
          what: 'Original location photo',
          at: location.created_date,
          evidenceClass: 'OBSERVED',
          source: 'Location record',
          freshness: freshness(location.created_date),
        }),
      );
    }
  }
  const checks = Array.isArray(fieldChecks) ? fieldChecks.slice(0, EVIDENCE_TIMELINE_CAP) : [];
  checks.forEach((check, index) => {
    events.push(
      event({
        id: check.id || `field-check:${index}`,
        kind: 'FIELD_CHECK',
        what:
          check.status === 'rejected'
            ? 'Field check rejected'
            : check.status === 'pending'
              ? 'Field check awaiting verification'
              : 'Field check observed',
        at: check.created_date,
        evidenceClass: 'OBSERVED',
        source: 'OOH Earth FieldCheck record',
        freshness: freshness(check.created_date),
        status: check.status,
        imageUrl: check.status === 'verified' ? check.image_url || null : null,
      }),
    );
  });
  const photos = Array.isArray(locationPhotos)
    ? locationPhotos.slice(0, EVIDENCE_TIMELINE_CAP)
    : [];
  photos.forEach((photo, index) => {
    if (photo.status !== 'verified' || !photo.url) return;
    events.push(
      event({
        id: photo.id || `location-photo:${index}`,
        kind: 'PHOTO_EVIDENCE',
        what: 'Verified photo evidence added',
        at: photo.created_date,
        evidenceClass: 'OBSERVED',
        source: 'OOH Earth LocationPhoto record',
        freshness: freshness(photo.created_date),
        status: photo.status,
        imageUrl: photo.url,
      }),
    );
  });
  const ordered = events.sort((a, b) => {
    const aTime = a.at ? Date.parse(a.at) : Number.NEGATIVE_INFINITY;
    const bTime = b.at ? Date.parse(b.at) : Number.NEGATIVE_INFINITY;
    return bTime - aTime || a.id.localeCompare(b.id);
  });
  const verifiedChecks = checks.filter((check) => check.status === 'verified');
  const changes =
    verifiedChecks.length >= 2 ? detectChanges(verifiedChecks[0], verifiedChecks[1]) : [];
  return {
    events: ordered.slice(
      0,
      Math.min(EVIDENCE_TIMELINE_CAP, Math.max(1, Number(cap) || EVIDENCE_TIMELINE_CAP)),
    ),
    changes,
    cap: EVIDENCE_TIMELINE_CAP,
    evidence_state: ordered.length ? 'EVIDENCE_PRESENT' : 'NO_EVIDENCE',
  };
}
