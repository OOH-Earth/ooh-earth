// Plain-text cleanup for RSS titles/links. Pure functions (no DOM, no HTML output): the result
// is only ever rendered as text. Kept separate from entry.ts so it can be unit-tested offline.

// Strips HTML tags to a fixed point (loops until a pass makes no further change) rather than a
// single regex pass -- a single pass can leave fragments that recombine into a new tag.
export function stripTags(s: string) {
  let prev;
  let cur = s;
  do {
    prev = cur;
    cur = cur.replace(/<[^>]+>/g, '');
  } while (cur !== prev);
  return cur;
}

const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
};
// One alternation, one pass: a replacement's output is never re-scanned, so "&amp;lt;" stays the
// literal text "&lt;" (no double-decode cascade).
const ENTITY_RE = /&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([a-zA-Z]+));/g;

function entity(match: string, dec?: string, hex?: string, name?: string) {
  if (name !== undefined) return NAMED[name] ?? match;
  const cp = dec !== undefined ? parseInt(dec, 10) : parseInt(hex as string, 16);
  // Reject controls (except tab/newline), surrogates and out-of-range code points.
  if (cp < 0x20 ? cp !== 9 && cp !== 10 : cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff))
    return match;
  if (cp >= 0x7f && cp <= 0x9f) return match;
  return String.fromCodePoint(cp);
}

// Decode BEFORE stripping tags so an entity-encoded tag ("&#60;script&#62;") cannot survive.
export function decode(s: string) {
  const withoutCdata = String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  const decoded = withoutCdata.replace(ENTITY_RE, entity);
  return stripTags(decoded).trim();
}
