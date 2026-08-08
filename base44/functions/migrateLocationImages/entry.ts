import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// One-off maintenance utility: migrates Location record image_url values
// still pointing at the legacy ooh.earth WordPress host into the app's own
// media storage. Idempotent — only touches records whose image_url still
// contains "ooh.earth", so partial runs / re-runs are safe.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const Loc = base44.asServiceRole.entities.Location;
    const Core = base44.asServiceRole.integrations.Core;

    // 1. Fetch every Location record still hotlinking ooh.earth
    const broken = await Loc.filter({ image_url: { $regex: "ooh.earth" } }, "-created_date", 5000);

    // 2. Unique legacy URLs
    const uniqueUrls = [...new Set(broken.map(r => r.image_url).filter(Boolean))];

    const migrated = [];
    const errors = [];

    // 3. Download + re-upload each unique image, then repoint all matching records
    for (const oldUrl of uniqueUrls) {
      try {
        const r = await fetch(oldUrl);
        if (!r.ok) { errors.push({ url: oldUrl, error: "HTTP " + r.status }); continue; }
        const buf = await r.arrayBuffer();
        const ct = r.headers.get("content-type") || "image/jpeg";
        const name = oldUrl.split("/").pop();
        const file = new File([buf], name, { type: ct });
        const res = await Core.UploadFile({ file });
        const newUrl = res.file_url;
        await Loc.updateMany({ image_url: oldUrl }, { $set: { image_url: newUrl } });
        migrated.push({ oldUrl, newUrl });
      } catch (e) {
        errors.push({ url: oldUrl, error: String(e).slice(0, 200) });
      }
    }

    return Response.json({
      brokenRecords: broken.length,
      uniqueUrls: uniqueUrls.length,
      migratedCount: migrated.length,
      errorCount: errors.length,
      migrated,
      errors
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}