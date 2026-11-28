import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { handleCleanupIntelCache } from './handler.ts';

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

// Admin-only (see handler.ts). The scheduled automation in function.jsonc stays
// inactive: a scheduled run has no verified admin user context, so confirm how
// the automation authenticates before enabling it.
Deno.serve((req) => handleCleanupIntelCache(req, { createClientFromRequest }));
