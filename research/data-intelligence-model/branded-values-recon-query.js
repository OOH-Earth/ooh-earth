// Reads the actual (small, ~12) non-empty brand_name/parent_corp/
// industry_sector string values. These describe a PUBLIC advertisement in
// public space -- not personal/contributor data -- so unlike prior recon
// passes this intentionally surfaces real field content, not just
// presence/counts, to validate entity resolution against the real
// advertiserRegistry.js. Still: no images, no identity fields, no
// --privileged, no writes.

const LOCATION_FIELDS = [
  'id',
  'type',
  'brand_name',
  'parent_corp',
  'industry_sector',
  'campaign_name',
  'status',
];
const CAP = 2000;

(async () => {
  const locations = await base44.entities.Location.filter(
    {},
    '-created_date',
    CAP,
    0,
    LOCATION_FIELDS,
  );
  const isFilled = (v) => v !== undefined && v !== null && v !== '';
  const branded = locations
    .filter((l) => isFilled(l.brand_name))
    .map((l) => ({
      type: l.type,
      status: l.status,
      brand_name: l.brand_name,
      parent_corp: l.parent_corp || null,
      industry_sector: l.industry_sector || null,
      campaign_name: l.campaign_name || null,
    }));
  console.log(JSON.stringify(branded, null, 2));
})();
