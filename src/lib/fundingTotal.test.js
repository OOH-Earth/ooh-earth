import test from 'node:test';
import assert from 'node:assert/strict';
import { fundingTotalView, FUNDING_UNAVAILABLE_LABEL } from './fundingTotal.js';

const verified = { status: 'verified', amount: 40, currency: 'USD', as_of: '2026-10-19T00:00:00Z' };

test('the legacy unverified numeric `raised` can never become a funding total', () => {
  for (const raised of [11, 0, 50000, '11', null, NaN]) {
    assert.deepEqual(fundingTotalView({ raised, donors: 1 }), { state: 'unavailable' });
  }
});

test('missing, malformed or failed responses are unavailable, not zero', () => {
  for (const s of [undefined, null, 'oops', [], {}, { error: 'x' }]) {
    assert.deepEqual(fundingTotalView(s), { state: 'unavailable' });
  }
});

test('a verified object is shown only when status, currency, amount and as_of are all valid', () => {
  assert.deepEqual(fundingTotalView({ verified_funding: verified }), {
    state: 'verified',
    amount: 40,
    currency: 'USD',
    asOf: '2026-10-19T00:00:00Z',
  });
  assert.equal(
    fundingTotalView({ verified_funding: { ...verified, amount: 0 } }).state,
    'verified',
  );
  for (const bad of [
    { ...verified, status: 'pending' },
    { ...verified, currency: 'EUR' },
    { ...verified, currency: undefined },
    { ...verified, amount: '40' },
    { ...verified, amount: -1 },
    { ...verified, amount: Infinity },
    { ...verified, as_of: 'not a date' },
    { ...verified, as_of: undefined },
  ]) {
    assert.equal(fundingTotalView({ verified_funding: bad }).state, 'unavailable');
  }
});

test('unavailable wording does not claim a figure', () => {
  assert.match(FUNDING_UNAVAILABLE_LABEL, /unavailable/i);
  assert.doesNotMatch(FUNDING_UNAVAILABLE_LABEL, /\$|\d|confirmed|raised/i);
});
