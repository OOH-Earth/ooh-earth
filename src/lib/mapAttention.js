import { FIELD_PRIORITY } from './geospatialIntelligence.js';

export const MAP_ATTENTION_FILTERS = Object.freeze({
  ALL: 'ALL',
  NEEDS_ATTENTION: 'NEEDS ATTENTION',
  PENDING: 'PENDING',
  STALE: 'STALE',
  MISSING_PHOTOS: 'MISSING PHOTOS',
  CURRENT: 'CURRENT',
});

export function attentionMatchesFilter(
  attention,
  filter = /** @type {string} */ (MAP_ATTENTION_FILTERS.ALL),
) {
  if (!attention) return false;
  switch (filter) {
    case MAP_ATTENTION_FILTERS.NEEDS_ATTENTION:
      return attention.priority !== FIELD_PRIORITY.CURRENT;
    case MAP_ATTENTION_FILTERS.PENDING:
      return attention.verification_state === 'PENDING';
    case MAP_ATTENTION_FILTERS.STALE:
      return attention.field_evidence === 'STALE' || attention.photo_state === 'STALE';
    case MAP_ATTENTION_FILTERS.MISSING_PHOTOS:
      return attention.photo_state === 'MISSING';
    case MAP_ATTENTION_FILTERS.CURRENT:
      return attention.priority === FIELD_PRIORITY.CURRENT;
    case MAP_ATTENTION_FILTERS.ALL:
    default:
      return true;
  }
}

export function attentionLabel(attention) {
  if (!attention) return 'UNKNOWN field attention';
  return `${attention.priority} field attention${attention.reasons?.length ? `: ${attention.reasons.join('; ')}` : ''}`;
}
