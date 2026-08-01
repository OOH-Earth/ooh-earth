import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Gated deliverable. Returns a StoreItem's `content` + `file_url` ONLY when:
//   • the item is free (status "free" or price 0), or
//   • the caller is signed in AND owns it (a paid Purchase exists).
// Otherwise it returns a locked marker with no deliverable. This is the only
// path that ever emits `content`/`file_url` to a client.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const itemId = String(body?.item_id || "");
    if (!itemId) return Response.json({ ok: false, error: "missing_item" }, { status: 200 });

    const item = await base44.asServiceRole.entities.StoreItem.get(itemId);
    if (!item) return Response.json({ ok: false, error: "not_found" }, { status: 200 });

    const isFree = item.status === "free" || Number(item.price_usd) === 0;
    if (isFree) {
      return Response.json({
        ok: true, owned: true, free: true,
        content: item.content || "", file_url: item.file_url || "",
      }, { status: 200 });
    }

    // Paid — require a signed-in owner.
    let me: any = null;
    try { me = await base44.auth.me(); } catch { me = null; }
    if (!me?.id) return Response.json({ ok: true, owned: false, locked: true, reason: "login_required" }, { status: 200 });

    const owns = await base44.asServiceRole.entities.Purchase.filter(
      { user_id: me.id, item_id: itemId, status: "paid" }, "-created_date", 1,
    );
    if (owns && owns.length) {
      return Response.json({
        ok: true, owned: true,
        content: item.content || "", file_url: item.file_url || "",
      }, { status: 200 });
    }
    return Response.json({ ok: true, owned: false, locked: true }, { status: 200 });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 200 });
  }
});
