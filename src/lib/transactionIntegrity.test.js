import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyOfflineFailure,
  classifyPaymentFailure,
  offlineTruth,
  paymentTruth,
  transactionIntegritySummary,
} from './transactionIntegrity.js';

test('offline truth separates boundary, replay, and write guarantees', () => {
  const result = offlineTruth({ boundary: 'VERIFIED', replay: 'VERIFIED' });
  assert.equal(result.boundary, 'VERIFIED');
  assert.equal(result.replay, 'VERIFIED');
  assert.equal(result.write_path, 'NOT_VERIFIED');
  assert.equal(result.guarantee, 'AT_LEAST_ONCE_WITH_IDEMPOTENT_REPLAY');
  assert.equal(result.exactly_once, 'NOT_GUARANTEED');
});

test('payment truth never upgrades security evidence into real payment success', () => {
  const result = paymentTruth({ signature: 'VERIFIED', replay: 'VERIFIED', ledger: 'VERIFIED' });
  assert.equal(result.signature_boundary, 'VERIFIED');
  assert.equal(result.replay, 'VERIFIED');
  assert.equal(result.ledger, 'VERIFIED');
  assert.equal(result.production_successful_payment, 'NOT_VERIFIED');
});

test('failure classification is bounded and conservative', () => {
  assert.equal(classifyOfflineFailure('malformed operation id'), 'FAILED_TERMINAL');
  assert.equal(classifyOfflineFailure('provider timeout'), 'FAILED_RETRYABLE');
  assert.equal(classifyOfflineFailure('something unexpected'), 'UNKNOWN');
  assert.equal(classifyPaymentFailure('invalid signature'), 'FAILED_TERMINAL');
  assert.equal(classifyPaymentFailure('database timeout'), 'FAILED_RETRYABLE');
  assert.equal(classifyPaymentFailure('something unexpected'), 'UNKNOWN');
});

test('summary contains no request payload or provider data', () => {
  const result = transactionIntegritySummary({
    offline: { boundary: 'VERIFIED', payload: '<script>' },
    payment: { signature: 'VERIFIED', stripe_body: 'secret' },
  });
  assert.deepEqual(Object.keys(result), ['offline', 'payment', 'limitations']);
  assert.equal(JSON.stringify(result).includes('<script>'), false);
  assert.equal(JSON.stringify(result).includes('secret'), false);
});
