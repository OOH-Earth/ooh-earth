// PROTOTYPE. Imports the REAL, unmodified, currently-shipping
// advertiserRegistry.js from this worktree's checkout of origin/main —
// not a copy, not a reimplementation. Nothing in that file is edited.
import {
  PARENT_CORPS,
  lookupParentCorpSector,
} from '../../src/components/ooh/report/advertiserRegistry.js';

// A proposed, NOT-shipped extension: brand -> parent-corp aliases for the
// handful of consumer brands whose parent isn't identical to a
// PARENT_CORPS entry (Sprite -> The Coca-Cola Company is the real example
// this recon surfaced). Kept separate from advertiserRegistry.js on
// purpose -- this file is a research artifact, not a change to the real
// registry.
const PROPOSED_BRAND_TO_PARENT_ALIASES = {
  sprite: 'The Coca-Cola Company',
  fanta: 'The Coca-Cola Company',
  diet_coke: 'The Coca-Cola Company',
};

function normalizeBrandKey(brand) {
  return brand
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');
}

// Real finding (12/12 records inspected): 2 of 12 have a parent-corp-style
// name (verbatim match against the real PARENT_CORPS list) sitting in
// brand_name instead of parent_corp -- likely a capture-time field mix-up,
// not a registry gap.
function detectFieldSwap(record) {
  return PARENT_CORPS.includes(record.brand_name);
}

// Resolves industry_sector for one record, returning WHY (provenance-
// shaped output, matching PR #153's source vocabulary) rather than a bare
// value.
function resolveSector(record) {
  if (record.industry_sector) {
    return { sector: record.industry_sector, source: 'already_filled', note: null };
  }
  if (record.parent_corp) {
    const sector = lookupParentCorpSector(record.parent_corp);
    if (sector) return { sector, source: 'registry_via_parent_corp', note: null };
  }
  if (detectFieldSwap(record)) {
    const sector = lookupParentCorpSector(record.brand_name);
    if (sector) {
      return {
        sector,
        source: 'registry_after_field_swap_correction',
        note: `brand_name "${record.brand_name}" matches a known parent-corp name verbatim -- likely belongs in parent_corp, not brand_name`,
      };
    }
  }
  const aliasTarget = PROPOSED_BRAND_TO_PARENT_ALIASES[normalizeBrandKey(record.brand_name)];
  if (aliasTarget) {
    const sector = lookupParentCorpSector(aliasTarget);
    if (sector) {
      return {
        sector,
        source: 'proposed_brand_alias_not_yet_shipped',
        note: `via proposed alias ${record.brand_name} -> ${aliasTarget} (not in production advertiserRegistry.js)`,
      };
    }
  }
  return {
    sector: null,
    source: 'unresolved',
    note: 'no registry path found for this brand/parent_corp',
  };
}

// Cheap, deterministic duplicate-placement candidate signal: exact
// brand_name match within the same record type. Zero image/geo/temporal
// data was fetched for this real set (out of scope for this recon pass),
// so this is necessarily a weaker signal than PR #152's geo+temporal+
// visual pipeline -- it's included because it costs nothing, needs no new
// data, and the real dataset already contains one genuine example (two
// "Zontes" billboards, different campaign taglines) worth surfacing as-is.
function findSameBrandGroups(records) {
  const byKey = new Map();
  records.forEach((r, i) => {
    const key = `${normalizeBrandKey(r.brand_name)}::${r.type}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(i);
  });
  return [...byKey.entries()]
    .filter(([, indices]) => indices.length >= 2)
    .map(([key, indices]) => ({ key, indices, count: indices.length }));
}

function resolveAll(records) {
  return records.map((r) => ({ ...r, resolution: resolveSector(r) }));
}

// Exhaustive audit, independent of whether sector resolution needed it --
// resolveSector() short-circuits on already_filled and never reaches
// detectFieldSwap for those records, which undercounts the real data-entry
// issue (a record can have a swapped field AND an already-correct sector
// from a different source).
function auditFieldSwaps(records) {
  return records.filter(detectFieldSwap);
}

export {
  resolveSector,
  resolveAll,
  detectFieldSwap,
  auditFieldSwaps,
  findSameBrandGroups,
  PROPOSED_BRAND_TO_PARENT_ALIASES,
};
