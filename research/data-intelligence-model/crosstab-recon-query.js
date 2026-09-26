const LOCATION_FIELDS = ['id', 'type', 'status', 'brand_name', 'image_url', 'created_date'];
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

  const byType = {};
  for (const l of locations) {
    const t = l.type || 'unknown';
    byType[t] = byType[t] || { total: 0, with_brand_name: 0, with_image: 0, verified: 0 };
    byType[t].total += 1;
    if (isFilled(l.brand_name)) byType[t].with_brand_name += 1;
    if (isFilled(l.image_url)) byType[t].with_image += 1;
    if (l.status === 'verified') byType[t].verified += 1;
  }

  // Non-transit subset -- the likely "organic field report" population
  const nonTransit = locations.filter((l) => l.type !== 'transit');
  const nonTransitDates = nonTransit
    .map((l) => l.created_date)
    .filter(Boolean)
    .sort();

  console.log(
    JSON.stringify(
      {
        by_type: byType,
        non_transit_total: nonTransit.length,
        non_transit_date_range: nonTransitDates.length
          ? { earliest: nonTransitDates[0], latest: nonTransitDates[nonTransitDates.length - 1] }
          : null,
      },
      null,
      2,
    ),
  );
})();
