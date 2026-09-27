// Mission (quest) periods — the ONE definition of "today" and "this week".
//
// Authoritative copy: base44/functions/claimQuest/period.ts (the server
// decides claim eligibility). This file must stay behaviourally identical;
// base44/functions/tests/questPeriod.test.ts runs both over the same
// instants and fails on any disagreement.
//
// - Everything is UTC, never the runtime's local timezone.
// - Daily  = the UTC calendar day.
// - Weekly = the ISO-8601 week, Monday 00:00 UTC → next Monday 00:00 UTC.
// - Base44 timestamps arrive without an offset ("2026-09-23T06:39:15.543000")
//   and are UTC; a browser would parse that as LOCAL time, so it is
//   normalised here before parsing.

const DAY = 86_400_000;

/** @param {unknown} value @returns {number} */
export function parseUtc(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  if (typeof value !== 'string' || !value) return NaN;
  const hasOffset = /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(value);
  const isDateTime = /^\d{4}-\d{2}-\d{2}T/.test(value);
  return Date.parse(isDateTime && !hasOffset ? `${value}Z` : value);
}

/** @param {string} type @param {unknown} at */
export function periodBounds(type, at) {
  const t = parseUtc(at);
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  if (type === 'daily') return { start: day, end: day + DAY };
  const sinceMonday = (new Date(day).getUTCDay() + 6) % 7;
  const start = day - sinceMonday * DAY;
  return { start, end: start + 7 * DAY };
}

/** @param {string} type @param {unknown} [at] */
export function periodKey(type, at = new Date()) {
  const b = periodBounds(type, at);
  if (!b) return null;
  if (type === 'daily') return new Date(b.start).toISOString().slice(0, 10);
  // ISO week-year is the year of that week's Thursday.
  const thursday = b.start + 3 * DAY;
  const year = new Date(thursday).getUTCFullYear();
  const week = Math.floor((thursday - Date.UTC(year, 0, 1)) / DAY / 7) + 1;
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** @param {unknown} value @param {string} type @param {unknown} [now] */
export function isInPeriod(value, type, now = new Date()) {
  const t = parseUtc(value);
  const b = periodBounds(type, now);
  return !!b && Number.isFinite(t) && t >= b.start && t < b.end;
}

// A completion counts for the current period by WHEN it was created. The
// stored period_key is only a fallback for rows without a timestamp: keys
// minted under the pre-2026-09-27 week formula can collide with a
// different ISO week of the same number.
/**
 * @param {any} completion @param {string} questId @param {string} type
 * @param {unknown} [now]
 */
export function isCompletionInPeriod(completion, questId, type, now = new Date()) {
  if (!completion || completion.quest_id !== questId) return false;
  if (Number.isFinite(parseUtc(completion.created_date))) {
    return isInPeriod(completion.created_date, type, now);
  }
  return completion.period_key === periodKey(type, now);
}

/** @param {string} type @param {unknown} [now] */
export function msUntilReset(type, now = new Date()) {
  const b = periodBounds(type, now);
  return b ? b.end - parseUtc(now) : null;
}
