const isPlatformAdmin = (user: any) => (user?.role ?? user?.data?.role) === 'admin';

type Dependencies = {
  createClientFromRequest: (req: Request) => any;
  fetchImpl?: typeof fetch;
};

export async function handleMigrateLocationImages(
  req: Request,
  { createClientFromRequest, fetchImpl = fetch }: Dependencies,
) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    let user;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }
    if (!isPlatformAdmin(user)) {
      return Response.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const Loc = base44.asServiceRole.entities.Location;
    const Core = base44.asServiceRole.integrations.Core;
    const broken: any[] = await Loc.filter(
      { image_url: { $regex: 'ooh.earth' } },
      '-created_date',
      5000,
    );
    const uniqueUrls: string[] = [...new Set(broken.map((r: any) => r.image_url).filter(Boolean))];
    const migrated = [];
    const errors = [];

    for (const oldUrl of uniqueUrls) {
      try {
        const r = await fetchImpl(oldUrl);
        if (!r.ok) {
          errors.push({ url: oldUrl, error: 'HTTP ' + r.status });
          continue;
        }
        const buf = await r.arrayBuffer();
        const ct = r.headers.get('content-type') || 'image/jpeg';
        const name = oldUrl.split('/').pop() || 'image.jpg';
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
      errors,
    });
  } catch (error) {
    console.error(
      'migrateLocationImages error:',
      error instanceof Error ? error.message : 'unknown',
    );
    return Response.json({ error: 'Migration failed' }, { status: 500 });
  }
}
