// Shared by FieldCheckPanel (src/components/ooh/FieldCheckPanel.jsx) and the
// map's LocationCard (src/components/ooh/map/LocationCard.jsx) -- a single
// pure derivation so both surfaces agree on what "confirmed" means, instead
// of two copies of the same date-comparison logic drifting apart.
//
// Deliberately NOT a fabricated stale/fresh verdict with an invented day
// threshold. Follows the same philosophy as TimeSinceTag
// (src/components/ooh/TimeSinceTag.jsx, already used elsewhere in this
// app): show the real elapsed time and let the reader judge, rather than
// assert a cutoff nothing in this dataset can justify (OOH campaign/
// rotation length varies enormously by market, operator, and unit type --
// there's no real number to anchor a threshold to here).
//
// "Confirmed" = either this location's own verified intake
// (status_updated_at) or a later VERIFIED re-check, whichever is more
// recent -- a re-check genuinely re-confirms the spot, so it should count.
export function computeFreshness(location, checks) {
  const verified = checks.filter((c) => c.status === 'verified');
  let lastConfirmedAt =
    location.status === 'verified' && location.status_updated_at
      ? location.status_updated_at
      : null;
  let source = lastConfirmedAt ? 'report' : null;
  const latestVerifiedCheck = verified[0];
  if (
    latestVerifiedCheck?.created_date &&
    (!lastConfirmedAt || new Date(latestVerifiedCheck.created_date) > new Date(lastConfirmedAt))
  ) {
    lastConfirmedAt = latestVerifiedCheck.created_date;
    source = 'recheck';
  }
  if (!lastConfirmedAt) return null;

  const mostRecentSubmission = checks[0];
  const pendingNewer =
    Boolean(mostRecentSubmission) &&
    mostRecentSubmission.status === 'pending' &&
    new Date(mostRecentSubmission.created_date) > new Date(lastConfirmedAt);

  return { lastConfirmedAt, source, pendingNewer, hasAnyCheck: checks.length > 0 };
}
