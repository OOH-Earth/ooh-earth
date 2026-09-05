/**
 * @typedef {'OBSERVED'|'REPORTED'|'DERIVED'|'ESTIMATED'|'FORECAST'|'UNKNOWN'} EvidenceStatus
 * @typedef {Object} ContextEvidence
 * @property {string} source
 * @property {string} source_id
 * @property {string|null} source_url
 * @property {string} category
 * @property {string} label
 * @property {string} value
 * @property {string|null} unit
 * @property {string} observed_at
 * @property {string} retrieved_at
 * @property {EvidenceStatus} evidence_status
 * @property {string|null} method
 * @property {number|null} distance_m
 * @property {string} geographic_scope
 * @property {string} license
 * @property {string} attribution
 * @property {string} freshness
 */

const DEMO_LOCATION_ID = 'context-demo-location';

/**
 * Controlled V1 fixture. It makes the contract visible without claiming a
 * live external integration or adding a database entity.
 * @type {Record<string, ContextEvidence[]>}
 */
export const LOCATION_CONTEXT_FIXTURES = Object.freeze({
  [DEMO_LOCATION_ID]: [
    {
      source: 'OOH Earth field record',
      source_id: DEMO_LOCATION_ID,
      source_url: 'https://oohearth.app',
      category: 'place',
      label: 'Context fixture',
      value: 'Controlled demonstration record',
      unit: null,
      observed_at: '2026-09-05',
      retrieved_at: '2026-09-05',
      evidence_status: 'OBSERVED',
      method: 'Reviewed static fixture; no external claim made',
      distance_m: 0,
      geographic_scope: 'This Location only',
      license: 'OOH Earth controlled fixture',
      attribution: 'OOH Earth',
      freshness: 'Static demonstration data',
    },
    {
      source: 'OOH Earth field record',
      source_id: DEMO_LOCATION_ID,
      source_url: 'https://oohearth.app',
      category: 'geospatial',
      label: 'Distance from Location anchor',
      value: '0',
      unit: 'm',
      observed_at: '2026-09-05',
      retrieved_at: '2026-09-05',
      evidence_status: 'DERIVED',
      method: 'Distance between the record coordinate and its own context anchor',
      distance_m: 0,
      geographic_scope: 'This Location only',
      license: 'OOH Earth controlled fixture',
      attribution: 'OOH Earth',
      freshness: 'Recalculate when source coordinates change',
    },
    {
      source: 'OOH Earth field record',
      source_id: DEMO_LOCATION_ID,
      source_url: 'https://oohearth.app',
      category: 'availability',
      label: 'External context coverage',
      value: 'Not connected',
      unit: null,
      observed_at: '2026-09-05',
      retrieved_at: '2026-09-05',
      evidence_status: 'UNKNOWN',
      method: null,
      distance_m: null,
      geographic_scope: 'This Location only',
      license: 'OOH Earth controlled fixture',
      attribution: 'OOH Earth',
      freshness: 'Unavailable until an approved source is connected',
    },
  ],
});

export function contextEvidenceFor(locationId) {
  return LOCATION_CONTEXT_FIXTURES[String(locationId)] || [];
}

export { DEMO_LOCATION_ID };
