/**
 * Human-reviewed registry for future Location context integrations.
 * This registry is policy data only: it performs no network reads.
 */
export const SOURCE_STATUSES = Object.freeze({
  APPROVED_FREE: 'APPROVED_FREE',
  FREE_WITH_RESTRICTIONS: 'FREE_WITH_RESTRICTIONS',
  RESEARCH: 'RESEARCH',
  BLOCKED_LICENSE: 'BLOCKED_LICENSE',
  BLOCKED_COMMERCIAL_USE: 'BLOCKED_COMMERCIAL_USE',
  BLOCKED_RATE_LIMIT: 'BLOCKED_RATE_LIMIT',
  PAID_NOT_ALLOWED: 'PAID_NOT_ALLOWED',
});

export const CONTEXT_SOURCE_REGISTRY = Object.freeze([
  {
    name: 'OOH Earth first-party field records',
    url: 'https://oohearth.app',
    category: 'first-party evidence',
    status: SOURCE_STATUSES.APPROVED_FREE,
    coverage: 'OOH Earth records already legitimately public',
    license: 'OOH Earth content terms; record-specific rights apply',
    attribution: 'OOH Earth',
    rateLimits: 'No external service dependency',
    caching: 'Use normal application caching only',
    commercialUse: 'Governed by OOH Earth content terms',
    reviewedAt: '2026-09-05',
  },
  {
    name: 'Wikidata structured data',
    url: 'https://www.wikidata.org/wiki/Wikidata:Licensing',
    category: 'landmarks and cultural context',
    status: SOURCE_STATUSES.FREE_WITH_RESTRICTIONS,
    coverage: 'Global, community-maintained structured entities',
    license: 'CC0 for main structured data namespace',
    attribution: 'Wikidata recommended',
    rateLimits: 'Public query service limits apply; no unbounded client fan-out',
    caching: 'Cache only bounded, attributable responses and respect service policy',
    commercialUse: 'Permitted for CC0 structured data; source-specific media may differ',
    reviewedAt: '2026-09-05',
  },
  {
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/copyright',
    category: 'maps and geospatial context',
    status: SOURCE_STATUSES.FREE_WITH_RESTRICTIONS,
    coverage: 'Global community map data',
    license: 'ODbL',
    attribution: 'OpenStreetMap and contributors',
    rateLimits: 'Public API, tiles and geocoding capacity policies apply',
    caching: 'Use approved extracts or bounded cached reads; respect tile policy',
    commercialUse: 'Permitted under ODbL with attribution and share-alike obligations',
    reviewedAt: '2026-09-05',
  },
  {
    name: 'GBIF',
    url: 'https://www.gbif.org/terms/data-user',
    category: 'biodiversity occurrences',
    status: SOURCE_STATUSES.FREE_WITH_RESTRICTIONS,
    coverage: 'Global, publisher-dependent occurrence records',
    license: 'Per-record license varies: CC0, CC BY or CC BY-NC',
    attribution: 'Retain publisher ownership and dataset citation/DOI',
    rateLimits: 'API and high-volume access restrictions apply',
    caching: 'Retain record IDs, licenses and citation metadata',
    commercialUse: 'Only where each record license permits it',
    reviewedAt: '2026-09-05',
  },
  {
    name: 'UNESCO World Heritage DataHub',
    url: 'https://data.unesco.org/explore/dataset/whc001/',
    category: 'heritage boundaries',
    status: SOURCE_STATUSES.RESEARCH,
    coverage: 'World Heritage List records and geographic fields',
    license: 'DataHub advertises CC BY-SA 4.0; UNESCO website reuse terms also apply',
    attribution: 'UNESCO',
    rateLimits: 'Must be confirmed for the selected API/export path',
    caching: 'Confirm redistribution and update obligations before caching',
    commercialUse: 'Requires source-path and content-rights confirmation',
    reviewedAt: '2026-09-05',
  },
  {
    name: 'Open Food Facts',
    url: 'https://openfoodfacts.github.io/openfoodfacts-server/api/',
    category: 'product identifiers',
    status: SOURCE_STATUSES.FREE_WITH_RESTRICTIONS,
    coverage: 'Global voluntary product coverage, strongest for food',
    license: 'ODbL database; product images and contents have separate terms',
    attribution: 'Open Food Facts plus applicable source/image attribution',
    rateLimits: 'Published read/search rate limits and custom User-Agent required',
    caching: 'Follow API terms; prefer permitted exports for scale',
    commercialUse: 'Depends on database, image and combined-database terms',
    reviewedAt: '2026-09-05',
  },
  {
    name: 'Government weather feeds',
    url: null,
    category: 'weather',
    status: SOURCE_STATUSES.RESEARCH,
    coverage: 'Country and agency dependent',
    license: 'Must be verified per agency and dataset',
    attribution: 'Agency dependent',
    rateLimits: 'Agency dependent',
    caching: 'Agency dependent',
    commercialUse: 'Not globally established',
    reviewedAt: '2026-09-05',
  },
  {
    name: 'Paid routing, weather, product and CV providers',
    url: null,
    category: 'external services',
    status: SOURCE_STATUSES.PAID_NOT_ALLOWED,
    coverage: 'Not selected',
    license: 'Not selected',
    attribution: 'Not applicable',
    rateLimits: 'Not applicable',
    caching: 'Not applicable',
    commercialUse: 'Not selected',
    reviewedAt: '2026-09-05',
  },
]);

export function isSafeSourceUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}
