import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Scheduled cleanup for the IntelCache entity. Every current IntelCache
// writer (cachedIntel, fieldNews, and this session's fieldStats/cryptoWatch/
// fetchMapLocations caching -- see TECHNICAL_DEBT_REGISTER.md) always
// CREATEs a fresh row on a cache miss, never updates/deletes the previous
// one for that cache_key. Left unattended, the table grows without bound --
// worst case (fieldStats' 30s window and cryptoWatch's 60s window hit
// continuously) is on the order of 1.5M rows/year combined. No IntelCache
// reader ever does a full-table scan (every read is either a narrow
// {cache_key, period_key} filter or a "most recent row for this cache_key"
// lookup), so this is a storage/hygiene concern rather than a proven public-
// facing performance one -- deliberately scoped as routine maintenance, not
// an emergency fix.
//
// Only uses SDK methods already proven working elsewhere in this codebase
// (paginated .list(), per-id .delete() -- see fieldStats/entry.ts and
// deleteMyAccount/entry.ts respectively). Base44's .filter() query-operator
// support for date-range comparisons (e.g. "$lt") is NOT documented and NOT
// used anywhere in this codebase -- rather than guess at unverified syntax,
// this pages through every row and compares created_date in plain JS.
// Runs off the public request path entirely (a scheduled automation, not a
// route any client ever calls), so an O(n) full-table page-through here does
// not carry the same cost concern fieldStats' old unbounded scan did.

const RETENTION_DAYS = 14;
const MAX_DELETES_PER_RUN = 5000; // defensive cap -- see function.jsonc note

async function listAll(entity, sort, pageSize = 500, hardCap = 200000) {
  const out = [];
  let skip = 0;
  while (out.length < hardCap) {
    const page = await entity.list(sort, pageSize, skip);
    if (!page || page.length === 0) break;
    out.push(...page);
    if (page.length < pageSize) break;
    skip += pageSize;
  }
  return out;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

    const rows = await listAll(base44.asServiceRole.entities.IntelCache, '-created_date');
    const stale = rows.filter((r) => {
      const t = r.created_date ? new Date(r.created_date).getTime() : NaN;
      return Number.isFinite(t) && t < cutoff;
    });

    const toDelete = stale.slice(0, MAX_DELETES_PER_RUN);
    let deleted = 0;
    for (const row of toDelete) {
      try {
        await base44.asServiceRole.entities.IntelCache.delete(row.id);
        deleted += 1;
      } catch (err) {
        // One bad row must never abort the rest of the cleanup pass.
        console.error('cleanupIntelCache: failed to delete', row.id, err?.message || err);
      }
    }

    return Response.json({
      ok: true,
      scanned: rows.length,
      stale: stale.length,
      deleted,
      truncated: stale.length > MAX_DELETES_PER_RUN,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
