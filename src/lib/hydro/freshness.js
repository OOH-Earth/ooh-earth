// Freshness of a river observation, derived from the observation timestamp.
//
// Providers do not publish a "stale after" rule. Evidence from real calls on 2026-10-07:
//   USGS  latest-continuous: newest value 7 minutes old; some "latest" values ~42 years old
//         (discontinued sensors). No expected-interval field.
//   UK EA latest readings: 17 minutes to 28 days old. Each measure carries a `period`
//         (reading interval in seconds, typically 900).
// So the thresholds below are OOH's own, documented here and shown to the user as ages:
//   CURRENT  age <= max(4 x expected interval, 1 h)          (EA: uses measure.period; USGS: 1 h)
//   RECENT   age <= 24 h
//   STALE    older. The value is still shown, always with its age.
//   NONE     the provider returned no observation for this measurement.
// A reading is NEVER carried forward or substituted by an older one: no observation stays "none".

export const FRESHNESS = {
  CURRENT: 'current',
  RECENT: 'recent',
  STALE: 'stale',
  NONE: 'none',
};

export const FRESHNESS_LABELS = {
  current: 'Current',
  recent: 'Recent',
  stale: 'Stale',
  none: 'No recent observation',
};

const HOUR = 3_600_000;

export function classifyFreshness(observedAt, now = Date.now(), expectedIntervalSec = null) {
  const t = observedAt instanceof Date ? observedAt.getTime() : Date.parse(observedAt);
  if (!Number.isFinite(t)) return { status: FRESHNESS.NONE, ageMs: null };
  const ageMs = Math.max(0, now - t);
  const currentLimit = Math.max(
    HOUR,
    Number.isFinite(expectedIntervalSec) && expectedIntervalSec > 0
      ? expectedIntervalSec * 4000
      : 0,
  );
  if (ageMs <= currentLimit) return { status: FRESHNESS.CURRENT, ageMs };
  if (ageMs <= 24 * HOUR) return { status: FRESHNESS.RECENT, ageMs };
  return { status: FRESHNESS.STALE, ageMs };
}

export function formatAge(ageMs) {
  if (!Number.isFinite(ageMs)) return 'unknown time';
  if (ageMs < 60_000) return 'just now';
  const min = Math.round(ageMs / 60_000);
  if (min < 60) return `${min} min ago`;
  const h = Math.round(ageMs / HOUR);
  if (h < 48) return `${h} h ago`;
  const d = Math.round(ageMs / (24 * HOUR));
  if (d < 730) return `${d} days ago`;
  return `${Math.round(d / 365)} years ago`;
}
