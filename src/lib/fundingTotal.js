// Public funding-total contract.
//
// `fieldStats.raised` is a sum of FundingLead.amount for channel "stripe" and
// "crypto" rows. It is not provider-verified (no paid-status, test/live,
// currency, refund or de-duplication check), so it must never be shown to the
// public as money raised, confirmed or received. A total is displayed only when
// the backend explicitly returns a provider-verified object:
//
//   verified_funding: { status: 'verified', amount: <number>, currency: 'USD', as_of: <ISO date> }
//
// No such field exists yet, so today every response resolves to "unavailable".
// Unavailable is NOT zero: missing payment evidence does not establish that
// nothing was received.

export const FUNDING_UNAVAILABLE_LABEL = 'Verified funding total unavailable';

/**
 * @typedef {{ state: 'verified', amount: number, currency: 'USD', asOf: string } | { state: 'unavailable' }} FundingTotalView
 */

/**
 * @param {any} stats
 * @returns {FundingTotalView}
 */
export function fundingTotalView(stats) {
  const v = stats && typeof stats === 'object' ? stats.verified_funding : null;
  if (
    v &&
    v.status === 'verified' &&
    v.currency === 'USD' &&
    typeof v.amount === 'number' &&
    Number.isFinite(v.amount) &&
    v.amount >= 0 &&
    typeof v.as_of === 'string' &&
    !Number.isNaN(Date.parse(v.as_of))
  ) {
    return { state: 'verified', amount: v.amount, currency: 'USD', asOf: v.as_of };
  }
  return { state: 'unavailable' };
}
