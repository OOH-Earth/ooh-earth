import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Reusable KML → Location importer.
// Payload: { kml_url, source_link?, type_default?, address_default?, status?, region? }
// Parses every <Placemark> with a name + <coordinates>, bulk-creates Location records.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let body: any = {};
    try { body = await req.json(); } catch { /* empty payload */ }

    const kmlUrl = body.kml_url;
    if (!kmlUrl || typeof kmlUrl !== 'string') {
      return Response.json({ error: 'kml_url is required' }, { status: 400 });
    }

    const sourceLink = body.source_link || '';
    const typeDefault = body.type_default || 'transit';
    const addressDefault = body.address_default || '';
    const status = body.status || 'verified';
    const region = body.region || '';

    const res = await fetch(kmlUrl, { redirect: 'follow' });
    if (!res.ok) {
      return Response.json({ error: `KML fetch failed: ${res.status}` }, { status: 502 });
    }
    const kml = await res.text();

    // Placemarks: some My Maps return a NetworkLink pointing elsewhere.
    if (/<NetworkLink>/.test(kml) && !/<Placemark>/.test(kml)) {
      const href = kml.match(/<href>([^<]+)<\/href>/);
      return Response.json({
        error: 'KML is a NetworkLink with no inline placemarks',
        network_link_href: href ? href[1] : null,
        hint: 'Re-run with kml_url set to this href',
      }, { status: 400 });
    }

    const pmRe = /<Placemark>([\s\S]*?)<\/Placemark>/g;
    const nameRe = /<name>([\s\S]*?)<\/name>/;
    const coordRe = /<coordinates>\s*([0-9eE.,\-+\s]+?)\s*<\/coordinates>/;
    const descRe = /<description>([\s\S]*?)<\/description>/;

    const records: any[] = [];
    let skipped = 0;

    let m: RegExpExecArray | null;
    while ((m = pmRe.exec(kml)) !== null) {
      const block = m[1];
      const nameMatch = block.match(nameRe);
      const coordMatch = block.match(coordRe);
      const descMatch = block.match(descRe);
      if (!nameMatch || !coordMatch) { skipped++; continue; }

      let name = nameMatch[1].trim();
      name = name.replace(/<!--\[CDATA\[([\s\S]*?)\]\]-->/, '$1').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim();
      if (!name) { skipped++; continue; }

      const coordStr = coordMatch[1].trim().split(/\s+/)[0];
      const parts = coordStr.split(',');
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      if (Number.isNaN(lat) || Number.isNaN(lng)) { skipped++; continue; }

      let notes = '';
      if (descMatch) {
        let d = descMatch[1].trim()
          .replace(/<!--\[CDATA\[([\s\S]*?)\]\]-->/, '$1').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim();
        d = d.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').trim();
        if (d) notes = d.slice(0, 280);
      }

      records.push({
        title: name,
        lat,
        lng,
        type: typeDefault,
        status,
        source_link: sourceLink,
        address: addressDefault || region || '',
        notes: notes || undefined,
      });
    }

    if (records.length === 0) {
      return Response.json({ parsed: 0, created: 0, skipped, message: 'No placemarks with name + coordinates found.' });
    }

    // Chunk into batches of 500 (bulkCreate limit).
    let created = 0;
    const BATCH = 500;
    for (let i = 0; i < records.length; i += BATCH) {
      const batch = records.slice(i, i + BATCH);
      const result = await base44.asServiceRole.entities.Location.bulkCreate(batch);
      created += Array.isArray(result) ? result.length : (batch.length);
    }

    return Response.json({
      parsed: records.length,
      created,
      skipped,
      sample: records.slice(0, 3),
    });
  } catch (error) {
    console.error('importKmlLocations error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});