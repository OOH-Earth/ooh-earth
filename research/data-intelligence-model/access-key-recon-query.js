const LOCATION_FIELDS = ['id', 'type', 'access_key', 'status', 'condition'];
const CAP = 2000;

(async () => {
  const locations = await base44.entities.Location.filter(
    {},
    '-created_date',
    CAP,
    0,
    LOCATION_FIELDS,
  );
  const transit = locations.filter((l) => l.type === 'transit');
  const keyBreakdown = transit.reduce((acc, l) => {
    const k = l.access_key || 'none';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  console.log(
    JSON.stringify(
      {
        total_transit_locations: transit.length,
        transit_access_key_breakdown: keyBreakdown,
        transit_with_known_key: transit.filter(
          (l) => l.access_key && l.access_key !== 'none' && l.access_key !== 'unknown',
        ).length,
      },
      null,
      2,
    ),
  );
})();
