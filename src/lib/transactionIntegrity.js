/**
 * Deterministic transaction-integrity vocabulary.
 *
 * This is a reasoning contract over the existing handlers. It does not make
 * distributed guarantees that the Base44 runtime cannot prove.
 */
export const OFFLINE_STATES = Object.freeze([
  'CREATED',
  'QUEUED',
  'SUBMITTED',
  'ACKNOWLEDGED',
  'REPLAYED',
  'FAILED_RETRYABLE',
  'FAILED_TERMINAL',
]);

export const PAYMENT_STATES = Object.freeze([
  'CHECKOUT_CREATED',
  'WEBHOOK_RECEIVED',
  'SIGNATURE_VERIFIED',
  'EVENT_LEDGERED',
  'BUSINESS_TRANSITION_APPLIED',
  'REPLAY_DETECTED',
  'RECONCILIATION_REQUIRED',
  'FAILED_RETRYABLE',
  'FAILED_TERMINAL',
]);

const bounded = (value, fallback = 'UNKNOWN') =>
  typeof value === 'string' && value.length <= 96 ? value : fallback;

export const OFFLINE_GUARANTEE = 'AT_LEAST_ONCE_WITH_IDEMPOTENT_REPLAY';

export function offlineTruth(input = {}) {
  const boundary = input.boundary === 'VERIFIED';
  const replay = input.replay === 'VERIFIED';
  const write = input.write === 'VERIFIED';
  return {
    boundary: boundary ? 'VERIFIED' : 'NOT_VERIFIED',
    replay: replay ? 'VERIFIED' : 'NOT_VERIFIED',
    write_path: write ? 'VERIFIED' : 'NOT_VERIFIED',
    guarantee: replay ? OFFLINE_GUARANTEE : 'UNKNOWN',
    exactly_once: 'NOT_GUARANTEED',
    cross_instance_uniqueness: 'RUNTIME_DEPENDENT',
    evidence: [
      boundary ? 'allowlisted entity and operation-id validation' : 'boundary evidence absent',
      replay ? 'server replay lookup and client queue uniqueness' : 'replay evidence absent',
      write ? 'disposable write path evidence' : 'write path not safely certified',
    ],
  };
}

export function paymentTruth(input = {}) {
  const signature = input.signature === 'VERIFIED';
  const replay = input.replay === 'VERIFIED';
  const ledger = input.ledger === 'VERIFIED';
  const lifecycle = input.test_lifecycle === 'VERIFIED';
  return {
    signature_boundary: signature ? 'VERIFIED' : 'NOT_VERIFIED',
    replay: replay ? 'VERIFIED' : 'NOT_VERIFIED',
    ledger: ledger ? 'VERIFIED' : 'NOT_VERIFIED',
    test_lifecycle: lifecycle ? 'VERIFIED' : 'NOT_VERIFIED',
    production_successful_payment: 'NOT_VERIFIED',
    evidence: [
      signature ? 'invalid-signature rejection and signing contract' : 'signature evidence absent',
      replay ? 'provider event and business-key replay suppression' : 'replay evidence absent',
      ledger ? 'bounded StripeEvent ledger transitions' : 'ledger evidence absent',
      lifecycle ? 'isolated test lifecycle' : 'no safe lifecycle evidence',
    ],
  };
}

export function classifyOfflineFailure(kind) {
  const value = bounded(kind, '').toLowerCase();
  if (/invalid|unsupported|malformed|forged/.test(value)) return 'FAILED_TERMINAL';
  if (/timeout|network|provider|unavailable|persistence/.test(value)) return 'FAILED_RETRYABLE';
  return 'UNKNOWN';
}

export function classifyPaymentFailure(kind) {
  const value = bounded(kind, '').toLowerCase();
  if (/signature|malformed|unauthorized|forbidden/.test(value)) return 'FAILED_TERMINAL';
  if (/timeout|provider|ledger|database|dependency|reconciliation/.test(value))
    return 'FAILED_RETRYABLE';
  return 'UNKNOWN';
}

export function transactionIntegritySummary({ offline = {}, payment = {} } = {}) {
  const offlineState = offlineTruth(offline);
  const paymentState = paymentTruth(payment);
  return {
    offline: offlineState,
    payment: paymentState,
    limitations: [
      'Exactly-once delivery is not guaranteed.',
      'Cross-instance uniqueness depends on Base44 runtime behavior.',
      'Successful Production payment processing is not verified without a safe isolated lifecycle.',
    ],
  };
}
