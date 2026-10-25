// Deterministic brand aggregation for the Home brand registry.
// Counts the structured `brand_name` field of the supplied records only. It does not read
// titles/notes/addresses, does not guess brand identity and does not merge aliases
// ("Coca-Cola" and "Coca Cola" stay separate). Case and whitespace differences are folded;
// the first spelling seen is displayed. Rejected records are excluded (moderation).
// The result describes the records passed in, not global totals.
export function normalizeBrandName(value) {
  if (typeof value !== 'string') return null;
  const text = value.normalize('NFKC').trim().replace(/\s+/g, ' ');
  return text || null;
}

export function countBrands(records, { limit = 6 } = {}) {
  const byKey = new Map();
  for (const record of Array.isArray(records) ? records : []) {
    if (!record || record.status === 'rejected') continue;
    const brand = normalizeBrandName(record.brand_name);
    if (!brand) continue;
    const key = brand.toLocaleLowerCase('en');
    const entry = byKey.get(key);
    if (entry) entry.count += 1;
    else byKey.set(key, { brand, count: 1 });
  }
  return [...byKey.values()]
    .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand, 'en'))
    .slice(0, limit);
}
