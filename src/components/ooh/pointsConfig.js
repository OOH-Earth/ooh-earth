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

// Points earned by a single FieldCheck (re-check) record. No photo_bonus
// branch -- FieldCheckCamera already requires a photo before submit, so
// every FieldCheck carries one; a separate bonus for it would be a no-op.
export function pointsForRecheck(fc) {
  let p = POINTS.recheck_filed;
  if (fc.status === 'verified') p += POINTS.recheck_verified_bonus;
  return p;
}

// Rank tier derived from cumulative operative points.
export function rankTier(points) {
  if (points >= 5000) return { label: 'Champion', accent: '#EDFF00' };
  if (points >= 2000) return { label: 'Field Reporter', accent: '#FF5C00' };
  if (points >= 500) return { label: 'Mapper', accent: '#39FF14' };
  if (points >= 100) return { label: 'Scout', accent: '#B2B2B2' };
  return { label: 'Newcomer', accent: '#666666' };
}
