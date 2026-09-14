// Entity Logos V1 -- evidence-backed logo registry + deterministic resolver.
//
// NO EVIDENCE, NO LOGO. A missing logo is an accepted, safe outcome; a
// generated, hand-traced, initials-as-official-mark, or hotlinked
// third-party image is not. Every entry in ENTITY_LOGOS must carry real
// provenance for its asset:
//   - an official brand/press/media resource, or
//   - an asset already committed to this repo with documented rights.
// Never a random search result, a scraped logo aggregator, or a guessed CDN
// URL. `asset.path` must always be a path into this repo's own bundled
// assets -- never a remote URL -- so logos never depend on network access
// and can never be swapped out by a third party after the fact.
//
// As of this V1 pass, no third-party corporate mark checked in this repo
// (advertisers, parent corporations, agencies, or OOH operators) had a
// locally-committed asset with defensible provenance, so ENTITY_LOGOS ships
// empty and every entity renders BrandBadge.jsx's neutral fallback. That is
// the correct, intentional result of this pass -- not a placeholder to be
// quietly filled in later without the same evidentiary bar.

/**
 * @typedef {Object} EntityLogoAsset
 * @property {string} path - path to a local, repo-committed image asset (never a remote URL)
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} EntityLogoEntry
 * @property {string} id - canonical entity id, e.g. 'jcdecaux'
 * @property {string} displayName - canonical display name shown in UI
 * @property {string[]} aliases - additional exact names/spellings that resolve to this entity
 * @property {EntityLogoAsset} asset - the approved local asset
 * @property {string} provenance - authoritative source the asset came from
 * @property {string} rights - the usage/rights basis for shipping this asset
 * @property {string} lastVerified - ISO date (YYYY-MM-DD) provenance was last checked
 */

/** @type {Record<string, EntityLogoEntry>} */
export const ENTITY_LOGOS = {
  // Intentionally empty for V1 (see file header). To add an entity:
  //   1. Obtain the asset from an authoritative source and commit it under
  //      src/assets/entity-logos/.
  //   2. Add an entry here with a real `provenance` and `rights` basis you
  //      can defend if asked -- not "found via search".
  //   3. Add its canonical id/aliases through normalizeEntityName exactly;
  //      resolution never does substring/fuzzy matching.
};

/**
 * Normalizes a free-text entity name for exact lookup: trims, lowercases,
 * and collapses internal whitespace. Non-string input normalizes to ''.
 * @param {unknown} name
 * @returns {string}
 */
export function normalizeEntityName(name) {
  if (typeof name !== 'string') return '';
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Builds a normalized alias -> canonical id index from a registry.
 * @param {Record<string, EntityLogoEntry>} registry
 * @returns {Record<string, string>}
 */
export function buildAliasIndex(registry) {
  /** @type {Record<string, string>} */
  const index = {};
  for (const entry of Object.values(registry || {})) {
    for (const alias of [entry.id, entry.displayName, ...(entry.aliases || [])]) {
      const key = normalizeEntityName(alias);
      if (!key) continue;
      if (index[key] && index[key] !== entry.id) {
        throw new Error(
          `Entity logo alias collision for "${key}": "${index[key]}" and "${entry.id}"`,
        );
      }
      index[key] = entry.id;
    }
  }
  return index;
}

/**
 * Resolves a free-text entity name to a curated logo entry, or null if none
 * is registered. Exact normalized match only -- deliberately no
 * substring/fuzzy matching, so a similar-but-different company name can
 * never attach the wrong mark.
 * @param {unknown} name
 * @param {Record<string, EntityLogoEntry>} [registry]
 * @returns {EntityLogoEntry | null}
 */
export function resolveEntityLogo(name, registry = ENTITY_LOGOS) {
  const key = normalizeEntityName(name);
  if (!key) return null;
  const id = buildAliasIndex(registry)[key];
  return id ? registry[id] : null;
}

/**
 * Pure decision used by BrandIcon: show the curated asset only when one is
 * resolved AND the image hasn't already failed to load. Extracted as a pure
 * function so the fallback contract is unit-testable without a DOM renderer.
 * @param {EntityLogoEntry | null} entry
 * @param {boolean} imageFailed
 * @returns {boolean}
 */
export function shouldRenderEntityAsset(entry, imageFailed) {
  return Boolean(entry?.asset?.path) && !imageFailed;
}
