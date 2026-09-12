const locations = await base44.entities.Location.list('-created_date', 2000);
const fieldChecks = await base44.entities.FieldCheck.list('-created_date', 2000);

const checksByLocation = {};
for (const fc of fieldChecks) {
  checksByLocation[fc.location_id] = (checksByLocation[fc.location_id] || 0) + 1;
}
const locationsWithAtLeastOneCheck = Object.keys(checksByLocation).length;
const locationsWithTwoPlusChecks = Object.values(checksByLocation).filter((c) => c >= 2).length;

const statusBreakdown = {};
for (const l of locations) statusBreakdown[l.status] = (statusBreakdown[l.status] || 0) + 1;

console.log(
  JSON.stringify(
    {
      total_locations_readable: locations.length,
      total_field_checks_readable: fieldChecks.length,
      locations_status_breakdown: statusBreakdown,
      locations_with_image_url: locations.filter((l) => !!l.image_url).length,
      locations_with_at_least_one_field_check: locationsWithAtLeastOneCheck,
      locations_with_two_or_more_field_checks: locationsWithTwoPlusChecks,
      field_checks_with_image_url: fieldChecks.filter((f) => !!f.image_url).length,
    },
    null,
    2,
  ),
);
