const RETENTION_DAYS = 14;
const MAX_DELETES_PER_RUN = 5000; // defensive cap -- see function.jsonc note
const isPlatformAdmin = (user: any) => (user?.role ?? user?.data?.role) === 'admin';

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
  now?: () => number;
};

async function listAll(entity: any, sort: string, pageSize = 500, hardCap = 200000) {
  const out: any[] = [];
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

// Security: this deletes rows through the service role and scans the whole
// IntelCache table, so it must never run for an anonymous or non-admin caller
// (it was previously reachable by anyone who could call the function URL).
// The authorization check happens BEFORE any service-role access.
export async function handleCleanupIntelCache(
  req: Request,
  { createClientFromRequest, now = () => Date.now() }: Dependencies,
) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }
  try {
    const base44 = createClientFromRequest(req);
    let caller = null;
    try {
      caller = await base44.auth.me();
    } catch {
      caller = null;
    }
    if (!caller?.id) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!isPlatformAdmin(caller)) {
      return Response.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const cutoff = now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
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
        console.error('cleanupIntelCache: failed to delete', row.id, (err as Error)?.name);
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
    console.error('cleanupIntelCache failed:', error instanceof Error ? error.name : 'unknown');
    return Response.json({ error: 'Cleanup unavailable' }, { status: 500 });
  }
}
