// Non-privileged, field-minimized, bounded (cap 2000/entity) read-only
// recon. No raw field values are logged — only aggregate counts/ranges —
// so nothing personally identifying or content-bearing ever leaves this
// process, let alone the report.

const LOCATION_FIELDS = ['id', 'type', 'lat', 'lng', 'status', 'created_date', 'image_url'];
const FIELDCHECK_FIELDS = ['id', 'location_id', 'status', 'created_date', 'image_url'];
const PHOTO_FIELDS = ['id', 'location_id', 'status', 'created_date', 'url'];
const CAP = 2000;

async function safeFilter(entityName, fields) {
  try {
    const entity = base44.entities[entityName];
    if (!entity) return { ok: false, error: 'entity not present on client' };
    const rows = await entity.filter({}, '-created_date', CAP, 0, fields);
    return { ok: true, rows };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function dateRange(rows) {
  const dates = rows
    .map((r) => r.created_date)
    .filter(Boolean)
    .sort();
  if (!dates.length) return null;
  return { earliest: dates[0], latest: dates[dates.length - 1] };
}

(async () => {
  const locResult = await safeFilter('Location', LOCATION_FIELDS);
  const fcResult = await safeFilter('FieldCheck', FIELDCHECK_FIELDS);
  const photoResult = await safeFilter('LocationPhoto', PHOTO_FIELDS);

  const locations = locResult.ok ? locResult.rows : [];
  const fieldChecks = fcResult.ok ? fcResult.rows : [];
  const photos = photoResult.ok ? photoResult.rows : [];

  const locationIds = new Set(locations.map((l) => l.id));

  // observation count per location_id: the Location's own creation counts
  // as observation #1; each linked FieldCheck is observation #2+.
  const obsCountByLocation = new Map();
  for (const l of locations) obsCountByLocation.set(l.id, 1);
  let orphanedFieldChecks = 0;
  for (const fc of fieldChecks) {
    if (!locationIds.has(fc.location_id)) {
      orphanedFieldChecks += 1; // linked to a Location outside this bounded page, not necessarily missing
      continue;
    }
    obsCountByLocation.set(fc.location_id, (obsCountByLocation.get(fc.location_id) || 1) + 1);
  }
  const locationsWithTwoPlusObservations = [...obsCountByLocation.values()].filter(
    (c) => c >= 2,
  ).length;

  const allObservations = [...locations, ...fieldChecks];
  const withImage = allObservations.filter((o) => !!o.image_url);
  const verifiedWithImage = allObservations.filter((o) => o.status === 'verified' && !!o.image_url);

  const summary = {
    location_query: locResult.ok ? 'ok' : `FAILED: ${locResult.error}`,
    fieldcheck_query: fcResult.ok ? 'ok' : `FAILED: ${fcResult.error}`,
    locationphoto_query: photoResult.ok ? 'ok' : `FAILED: ${photoResult.error}`,
    total_locations_readable: locations.length,
    total_locations_hit_cap: locations.length === CAP,
    total_fieldchecks_readable: fieldChecks.length,
    total_fieldchecks_hit_cap: fieldChecks.length === CAP,
    total_locationphotos_readable: photos.length,
    total_locationphotos_hit_cap: photos.length === CAP,
    fieldchecks_referencing_a_location_outside_this_page: orphanedFieldChecks,
    locations_with_two_or_more_observations: locationsWithTwoPlusObservations,
    observations_total: allObservations.length,
    observations_with_image_reference: withImage.length,
    verified_observations_with_image_reference: verifiedWithImage.length,
    location_status_breakdown: locations.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {}),
    fieldcheck_status_breakdown: fieldChecks.reduce((acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1;
      return acc;
    }, {}),
    location_date_range: dateRange(locations),
    fieldcheck_date_range: dateRange(fieldChecks),
  };

  console.log(JSON.stringify(summary, null, 2));
})();
