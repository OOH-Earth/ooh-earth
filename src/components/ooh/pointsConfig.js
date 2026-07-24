// OOH Earth rewards / points system
// Points are computed from attributed field contributions (Location records).
// Operatives earn points per report, boosted by verification and photo evidence.

export const POINTS = {
  report_filed: 10, // base credit for every filed report
  verified_bonus: 40, // + when an admin marks the report verified
  photo_bonus: 50, // + when the report carries photo evidence
};

// Points earned by a single Location record.
export function pointsForReport(r) {
  let p = POINTS.report_filed;
  if (r.status === "verified") p += POINTS.verified_bonus;
  if (r.image_url || r.image) p += POINTS.photo_bonus;
  return p;
}

// Rank tier derived from cumulative operative points.
export function rankTier(points) {
  if (points >= 5000) return { label: "Vanguard", accent: "#EDFF00" };
  if (points >= 2000) return { label: "Operative", accent: "#FF5C00" };
  if (points >= 500) return { label: "Field", accent: "#39FF14" };
  if (points >= 100) return { label: "Scout", accent: "#B2B2B2" };
  return { label: "Recruit", accent: "#666666" };
}