// Shared by FieldCheckPanel (src/components/ooh/FieldCheckPanel.jsx), the
// map's LocationCard (src/components/ooh/map/LocationCard.jsx), and the
// Recently Changed feed (src/hooks/useRecentFieldChanges.js) -- a single
// pure derivation so every surface agrees on what "confirmed" and "changed"
// mean, instead of copies of the same logic drifting apart.

export const CONDITION_LABELS = {
  functional: 'Functional',
  neglected: 'Neglected',
  damaged: 'Damaged',
  abandoned: 'Abandoned',
  reclaimed: 'Reclaimed',
  upgraded: 'Upgraded',
};

// Compares two VERIFIED observations of the same spot. Only fields present
// on BOTH sides and genuinely different are reported -- never an invented
// "unset -> X" line, never a claim sourced from an unverified check.
export function detectChanges(latest, earlier) {
  if (!latest || !earlier) return [];
  const fields = [
    { key: 'brand_name', label: 'Brand' },
    { key: 'condition', label: 'Condition', display: (v) => CONDITION_LABELS[v] || v },
    { key: 'adbust_type', label: 'Intervention', display: (v) => v.replace(/_/g, ' ') },
  ];
  const changes = [];
  for (const { key, label, display = (v) => v } of fields) {
    const before = String(earlier[key] || '').trim();
    const after = String(latest[key] || '').trim();
    if (!before || !after) continue;
    if (before.toLowerCase() === after.toLowerCase()) continue;
    changes.push({ key, label, before: display(before), after: display(after) });
  }
  return changes;
}
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
