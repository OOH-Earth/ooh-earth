// OOH Earth rewards / points system
// Points are computed from attributed field contributions (Location records).
// Operatives earn points per report, boosted by verification and photo evidence.

export const POINTS = {
  report_filed: 10, // base credit for every filed report
  verified_bonus: 40, // + when an admin marks the report verified
  photo_bonus: 50, // + when the report carries photo evidence
  // Deliberately smaller than a new report's full value (max ~100): a
  // re-check confirms a spot rather than discovering one, so it should
  // never outcompete filing a new report as the higher-priority action.
  // Still real and non-zero -- previously a re-check earned exactly 0 XP
  // (see useGamification.js's prior comment), the clearest concrete gap
  // this repo had in its own repeat-observation incentive loop.
  recheck_filed: 5, // base credit for filing a re-check
  recheck_verified_bonus: 15, // + when an admin verifies the re-check
};

// Points earned by a single Location record.
export function pointsForReport(r) {
  let p = POINTS.report_filed;
  if (r.status === 'verified') p += POINTS.verified_bonus;
  if (r.image_url || r.image) p += POINTS.photo_bonus;
  return p;
}

// Points earned by a single FieldCheck (re-check) record. Verified-only,
// unlike pointsForReport's base-credit-always shape: a pending or rejected
// re-check earns nothing at all. The goal here is specifically VERIFIED
// repeated evidence, not raw submission activity -- rewarding mere
// submission would incentivize exactly the noise this feature exists to
// avoid. No separate photo_bonus branch -- FieldCheckCamera already
// requires a photo before submit, so every FieldCheck carries one.
export function pointsForRecheck(fc) {
  return fc.status === 'verified' ? POINTS.recheck_filed + POINTS.recheck_verified_bonus : 0;
}

// Rank tier derived from cumulative operative points.
export function rankTier(points) {
  if (points >= 5000) return { label: 'Champion', accent: '#EDFF00' };
  if (points >= 2000) return { label: 'Field Reporter', accent: '#FF5C00' };
  if (points >= 500) return { label: 'Mapper', accent: '#39FF14' };
  if (points >= 100) return { label: 'Scout', accent: '#B2B2B2' };
  return { label: 'Newcomer', accent: '#666666' };
}
