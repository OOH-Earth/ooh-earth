import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Public, PII-free aggregate field stats for the orbital HUD.
// Returns counts/totals only — never exposes donor or operative records.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const [locs, leads] = await Promise.all([
      base44.asServiceRole.entities.Location.list('-created_date', 500),
      base44.asServiceRole.entities.FundingLead.list('-created_date', 200),
    ]);

    const active = (locs || []).filter((r) => r.status !== 'rejected');
    let points = 0;
    let verified = 0;
    const ops = new Set();
    const cities = new Set();
    for (const r of active) {
      let p = 10; // base credit per filed report
      if (r.status === 'verified') { p += 40; verified += 1; }
      if (r.image_url) p += 50; // photo evidence bonus
      points += p;
      if (r.created_by_id) ops.add(r.created_by_id);
      const parts = String(r.address || '').split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.length) cities.add(parts[parts.length - 1]);
    }
    const raised = (leads || []).reduce((s, l) => s + (Number(l.amount) || 0), 0);

    return Response.json({
      reports: active.length,
      verified,
      operatives: ops.size,
      cities: cities.size,
      points,
      raised,
      donors: (leads || []).length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});