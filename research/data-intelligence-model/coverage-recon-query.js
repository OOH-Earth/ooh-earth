// Extension of the previous production recon (research/real-evidence-
// benchmark/production-recon-query.js). Same discipline: non-privileged,
// bounded (cap 2000), field-projected. Adds advertiser/sector/campaign
// coverage fields -- still no identity fields, no image bytes, no
// --privileged. Aggregate counts only; no per-record values are logged.

const LOCATION_FIELDS = [
  'id',
  'type',
  'status',
  'brand_name',
  'parent_corp',
  'industry_sector',
  'campaign_name',
  'ooh_operator',
  'ad_agency',
  'harm_tags',
  'condition',
  'adbust_type',
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
  const nonEmptyRate = (field) => {
    const filled = locations.filter((l) => isFilled(l[field])).length;
    return {
      filled,
      total: locations.length,
      pct: Math.round((filled / locations.length) * 1000) / 10,
    };
  };

  const uniqueNonEmpty = (field) =>
    new Set(locations.filter((l) => isFilled(l[field])).map((l) => l[field])).size;

  const typeBreakdown = locations.reduce((acc, l) => {
    acc[l.type] = (acc[l.type] || 0) + 1;
    return acc;
  }, {});
  const sectorBreakdown = locations.reduce((acc, l) => {
    if (isFilled(l.industry_sector)) acc[l.industry_sector] = (acc[l.industry_sector] || 0) + 1;
    return acc;
  }, {});
  const harmTagsPresent = locations.filter(
    (l) => Array.isArray(l.harm_tags) && l.harm_tags.length > 0,
  ).length;
  const adbustPresent = locations.filter((l) => l.adbust_type && l.adbust_type !== 'none').length;

  console.log(
    JSON.stringify(
      {
        total_locations: locations.length,
        field_coverage: {
          brand_name: nonEmptyRate('brand_name'),
          parent_corp: nonEmptyRate('parent_corp'),
          industry_sector: nonEmptyRate('industry_sector'),
          campaign_name: nonEmptyRate('campaign_name'),
          ooh_operator: nonEmptyRate('ooh_operator'),
          ad_agency: nonEmptyRate('ad_agency'),
        },
        unique_value_counts: {
          unique_brand_names: uniqueNonEmpty('brand_name'),
          unique_parent_corps: uniqueNonEmpty('parent_corp'),
          unique_campaign_names: uniqueNonEmpty('campaign_name'),
          unique_ooh_operators: uniqueNonEmpty('ooh_operator'),
        },
        type_breakdown: typeBreakdown,
        sector_breakdown: sectorBreakdown,
        locations_with_harm_tags: harmTagsPresent,
        locations_with_active_adbust: adbustPresent,
      },
      null,
      2,
    ),
  );
})();
