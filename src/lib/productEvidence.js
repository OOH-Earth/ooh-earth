/**
 * Provider-independent Product Evidence contract.
 * Provider payloads must terminate at the productLookup adapter boundary.
 */

export const PRODUCT_EVIDENCE_STATES = Object.freeze({
  AVAILABLE: 'available',
  EMPTY: 'empty',
  UNAVAILABLE: 'unavailable',
});

export function unknownAssertion(label, field) {
  return {
    field,
    value: null,
    label,
    evidence_status: 'UNKNOWN',
    evidence_class: 'UNKNOWN',
    source: null,
    source_id: null,
    source_url: null,
    retrieved_at: null,
    license: null,
    attribution: null,
    method: 'No source-backed value was returned for this field',
  };
}

export function normalizeProductResult(result) {
  if (!result || typeof result !== 'object') {
    return { status: PRODUCT_EVIDENCE_STATES.UNAVAILABLE, product: null };
  }
  if (result.status !== PRODUCT_EVIDENCE_STATES.AVAILABLE || !result.product) {
    return {
      status: result.status || PRODUCT_EVIDENCE_STATES.UNAVAILABLE,
      product: null,
      reason: result.reason,
    };
  }
  return result;
}
