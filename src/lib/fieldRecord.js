// Field Record — the recent verified places on a public Founding Profile.
//
// The server (getPublicProfile) already restricts this to the member's own
// verified Locations, capped and projected to { id, title, type,
// created_date(YYYY-MM-DD) }. This normaliser is the client's defence in
// depth: it re-caps, drops anything without a URL-safe id (so no row can
// produce an unsafe href), and never reads a field outside that allowlist.

export const FIELD_RECORD_MAX = 5;

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const FIELD_RECORD_TYPE_LABELS = {
  billboard: 'Billboard',
  painted: 'Painted',
  digital: 'Digital',
  projection: 'Projection',
  sticker: 'Sticker',
  mural: 'Mural',
  transit: 'Transit',
  skatepark: 'Skatepark',
  basketball_court: 'Basketball Court',
  multi_use_court: 'Multi-Use Court',
  other: 'Other',
};

// Day-precision, locale- and timezone-independent ("12 MAY 2026"), so the
// same record never renders as a different day for different viewers.
export function fieldRecordDateLabel(value) {
  const m = typeof value === 'string' ? DAY.exec(value) : null;
  if (!m) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${day} ${MONTHS[month - 1]} ${m[1]}`;
}

export function fieldRecordEntries(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const r of raw) {
    if (out.length >= FIELD_RECORD_MAX) break;
    if (!r || typeof r !== 'object') continue;
    const id = r.id;
    if (typeof id !== 'string' || !SAFE_ID.test(id) || seen.has(id)) continue;
    seen.add(id);
    const type = typeof r.type === 'string' && FIELD_RECORD_TYPE_LABELS[r.type] ? r.type : 'other';
    const title = typeof r.title === 'string' && r.title.trim() ? r.title.trim() : 'Untitled place';
    out.push({
      id,
      href: `/location/${id}`,
      title,
      type,
      typeLabel: FIELD_RECORD_TYPE_LABELS[type],
      date: typeof r.created_date === 'string' && DAY.test(r.created_date) ? r.created_date : null,
      dateLabel: fieldRecordDateLabel(r.created_date),
    });
  }
  return out;
}
