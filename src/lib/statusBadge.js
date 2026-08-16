// Shared color/label logic for a Location's moderation status
// (pending/verified/rejected) -- previously duplicated as inline color
// literals across ~7 components (map pins, popups, the 3D globe, the
// moderation dashboard, the detail page), with two conventions that had
// quietly drifted apart: a 2-color map-pin dot (verified vs not) and a
// richer 3-way admin badge where Dashboard.jsx and LocationDetail.jsx
// disagreed on what color meant "pending" -- and LocationDetail didn't
// visually distinguish "rejected" from "verified" at all (same neutral
// color, differing only by an icon). This is the single source for both.

export const STATUS_DOT_COLORS = {
  verified: '#39FF14',
  pending: '#FF5C00',
  rejected: '#FF5C00',
};

/** Binary green/orange dot used on map pins and compact popups. */
export function getStatusDotColor(status) {
  return status === 'verified' ? STATUS_DOT_COLORS.verified : STATUS_DOT_COLORS.pending;
}

/** Full 3-way border/text classes for admin/detail-page badges. */
export const STATUS_BADGE_CLASSES = {
  pending: 'border-ozone/50 text-ozone',
  verified: 'border-silver/30 text-silver',
  rejected: 'border-flare/50 text-flare',
};

export function getStatusBadgeClasses(status) {
  return STATUS_BADGE_CLASSES[status] || STATUS_BADGE_CLASSES.pending;
}
