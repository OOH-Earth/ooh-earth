import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Public storefront catalog. Returns StoreItem METADATA ONLY — never the
// deliverable (`content` / `file_url`). The StoreItem entity is admin-read-locked
// so the goods can't leak to the browser; the storefront reads through this.
// Pass { item_id } for a single item's metadata; omit for the full catalogue.
const META_FIELDS = [
  'id',
  'title',
  'subtitle',
  'description',
  'category',
  'price_usd',
  'status',
  'image_url',
  'external_url',
  'edition_size',
  'edition_sold',
  'tags',
  'featured',
  'sort_order',
  'created_date',
];

function toMeta(it: any) {
  const o: any = {};
  for (const k of META_FIELDS) if (it?.[k] !== undefined) o[k] = it[k];
  // Signal (without leaking) whether a locked deliverable exists.
  o.has_content = !!(it?.content && String(it.content).trim());
  o.has_file = !!it?.file_url;
  return o;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const itemId = body?.item_id ? String(body.item_id) : '';

    if (itemId) {
      const it = await base44.asServiceRole.entities.StoreItem.get(itemId);
      if (!it) return Response.json({ ok: false, error: 'not_found' }, { status: 200 });
      return Response.json({ ok: true, item: toMeta(it) }, { status: 200 });
    }

    // Full catalogue — paginate so nothing is silently undercounted.
    const all: any[] = [];
    const pageSize = 100;
    for (let skip = 0; skip < 2000; skip += pageSize) {
      const page = await base44.asServiceRole.entities.StoreItem.list(
        '-created_date',
        pageSize,
        skip,
      );
      if (!page || !page.length) break;
      all.push(...page);
      if (page.length < pageSize) break;
    }
    return Response.json({ ok: true, items: all.map(toMeta) }, { status: 200 });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 200 });
  }
});
