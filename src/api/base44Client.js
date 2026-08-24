// @ts-nocheck -- intentionally excluded from typecheck (jsconfig.json), see TECHNICAL_DEBT_REGISTER.md
import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl,
});

// Page through the Location entity so counts and maps reflect the true total
// instead of a silent single-request cap. A flat list(sort, 500) undercounts
// once the dataset grows past a page (the fieldStats function paginates for
// the same reason). Attached to the client so existing `base44` importers can
// call it without adding an import.
base44.listAllLocations = async (sort = '-created_date', pageSize = 500, hardCap = 5000) => {
  const out = [];
  let skip = 0;
  while (out.length < hardCap) {
    const page = await base44.entities.Location.list(sort, pageSize, skip);
    if (!page || page.length === 0) break;
    out.push(...page);
    if (page.length < pageSize) break;
    skip += pageSize;
  }
  return out;
};

// Query only the visible geographic window for the flat map. Base44 documents
// Mongo-style comparison/logical operators, so this is a server-side filter;
// it is not a client-side slice of listAllLocations().
const MAP_FIELDS = [
  'id',
  'title',
  'type',
  'address',
  'lat',
  'lng',
  'image_url',
  'source_link',
  'status',
  'status_updated_at',
  'created_by_id',
  'created_date',
  'graffiti_medium',
  'graffiti_style',
  'graffiti_surface_m2',
  'graffiti_coverage_pct',
  'adbust_type',
  'brand_name',
  'industry_sector',
  'harm_tags',
  'condition',
  'campaign_name',
  'ad_agency',
  'parent_corp',
  'ooh_operator',
  'adbust_image_url',
];

base44.listViewportLocations = async ({ n, s, e, w }, limit = 1000) => {
  const north = Math.min(90, Number(n));
  const south = Math.max(-90, Number(s));
  const rawEast = Number(e);
  const rawWest = Number(w);
  if (![north, south, rawEast, rawWest].every(Number.isFinite) || north < south) return [];
  const normalizeLng = (value) => ((((value + 180) % 360) + 360) % 360) - 180;
  const east = normalizeLng(rawEast);
  const west = normalizeLng(rawWest);

  const latitude = { $gte: south, $lte: north };
  const longitudeSpan = Math.abs(rawEast - rawWest);
  const longitude =
    longitudeSpan >= 359
      ? undefined
      : west <= east
        ? { $gte: west, $lte: east }
        : { $or: [{ $gte: west }, { $lte: east }] };
  const query = longitude ? { lat: latitude, lng: longitude } : { lat: latitude };
  return base44.entities.Location.filter(query, '-created_date', limit, 0, MAP_FIELDS);
};
