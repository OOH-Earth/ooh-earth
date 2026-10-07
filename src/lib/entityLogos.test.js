import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ENTITY_LOGOS,
  buildAliasIndex,
  normalizeEntityName,
  resolveEntityLogo,
  shouldRenderEntityAsset,
} from './entityLogos.js';

// A synthetic fixture registry -- NOT the shipped ENTITY_LOGOS -- used to
// prove the resolution mechanism itself (exact alias match, normalization,
// no fuzzy matching) without needing a real shipped asset to exercise it.
const fixtureRegistry = {
  acme: {
    id: 'acme',
    displayName: 'Acme Media',
    aliases: ['Acme Corp', 'ACME  Media  Group'],
    asset: { path: 'src/assets/entity-logos/acme.svg', width: 32, height: 32 },
    provenance: 'https://acme.example/press-kit (test fixture)',
    rights: 'test fixture only',
    lastVerified: '2026-01-01',
  },
  'coca-cola': {
    id: 'coca-cola',
    displayName: 'The Coca-Cola Company',
    aliases: ['Coca Cola'],
    asset: { path: 'src/assets/entity-logos/coca-cola.svg', width: 32, height: 32 },
    provenance: 'test fixture only',
    rights: 'test fixture only',
    lastVerified: '2026-01-01',
  },
};

test('known approved entity resolves to exact curated asset', () => {
  const entry = resolveEntityLogo('Acme Media', fixtureRegistry);
  assert.equal(entry?.id, 'acme');
  assert.equal(entry?.asset.path, 'src/assets/entity-logos/acme.svg');
});

test('supported alias resolves to same canonical entity, normalized', () => {
  assert.equal(resolveEntityLogo('acme corp', fixtureRegistry)?.id, 'acme');
  assert.equal(resolveEntityLogo('  ACME   Media   Group  ', fixtureRegistry)?.id, 'acme');
});

test('unknown entity resolves to null (caller falls back to neutral treatment)', () => {
  assert.equal(resolveEntityLogo('Totally Unknown Co', fixtureRegistry), null);
});

test('missing/empty entity resolves to null', () => {
  assert.equal(resolveEntityLogo('', fixtureRegistry), null);
  assert.equal(resolveEntityLogo(undefined, fixtureRegistry), null);
  assert.equal(resolveEntityLogo(null, fixtureRegistry), null);
  assert.equal(resolveEntityLogo('   ', fixtureRegistry), null);
});

test('malformed input safely falls back instead of throwing', () => {
  assert.doesNotThrow(() => resolveEntityLogo(123, fixtureRegistry));
  assert.doesNotThrow(() => resolveEntityLogo({}, fixtureRegistry));
  assert.doesNotThrow(() => resolveEntityLogo(['Acme'], fixtureRegistry));
  assert.equal(resolveEntityLogo(123, fixtureRegistry), null);
  assert.equal(normalizeEntityName(123), '');
  assert.equal(normalizeEntityName(null), '');
});

test('similar-but-not-exact company names do not incorrectly resolve', () => {
  // Old BrandBadge behavior did `key.includes(brand) || brand.includes(key)`,
  // which would have wrongly matched all of these against 'coca-cola'.
  assert.equal(resolveEntityLogo('coca-cola company', fixtureRegistry), null);
  assert.equal(resolveEntityLogo('coca', fixtureRegistry), null);
  assert.equal(resolveEntityLogo('New Coca-Cola Bottling Partners', fixtureRegistry), null);
  assert.equal(resolveEntityLogo('Diet Coca-Cola', fixtureRegistry), null);
});

test('buildAliasIndex ignores blank aliases, allows same-entry duplicates, and handles empty registry', () => {
  assert.deepEqual(buildAliasIndex({}), {});
  const index = buildAliasIndex({
    x: { id: 'x', displayName: 'X Corp', aliases: ['', '   ', 'X Corp'] },
  });
  assert.deepEqual(Object.keys(index).sort(), ['x', 'x corp']);
});

test('buildAliasIndex rejects duplicate aliases across different entities', () => {
  assert.throws(
    () =>
      buildAliasIndex({
        alpha: {
          id: 'alpha',
          displayName: 'Alpha Outdoor',
          aliases: ['Shared Alias'],
        },
        beta: {
          id: 'beta',
          displayName: 'Beta Outdoor',
          aliases: ['  shared   alias  '],
        },
      }),
    /Entity logo alias collision/,
  );
});

test('shipped ENTITY_LOGOS alias index has no silent collisions', () => {
  assert.doesNotThrow(() => buildAliasIndex(ENTITY_LOGOS));
});

test('shouldRenderEntityAsset only shows the asset when resolved and not failed', () => {
  const entry = fixtureRegistry.acme;
  assert.equal(shouldRenderEntityAsset(entry, false), true);
  assert.equal(
    shouldRenderEntityAsset(entry, true),
    false,
    'image load failure falls back neutrally',
  );
  assert.equal(shouldRenderEntityAsset(null, false), false);
  assert.equal(shouldRenderEntityAsset({ id: 'no-asset' }, false), false);
});

test('shipped ENTITY_LOGOS ships with zero unsupported claims: every path is local, never remote', () => {
  for (const entry of Object.values(ENTITY_LOGOS)) {
    assert.match(
      entry.asset.path,
      /^src\/assets\/entity-logos\//,
      `${entry.id} must use a local asset path`,
    );
    assert.doesNotMatch(entry.asset.path, /^https?:\/\//i, `${entry.id} must not be a remote URL`);
    assert.ok(entry.provenance?.trim(), `${entry.id} must record provenance`);
    assert.ok(entry.rights?.trim(), `${entry.id} must record a rights/usage basis`);
  }
});

test('BrandBadge no longer contains fake/approximated brand marks', () => {
  const brandBadgePath = fileURLToPath(
    new URL('../components/ooh/BrandBadge.jsx', import.meta.url),
  );
  const source = readFileSync(brandBadgePath, 'utf8');
  // These were the old hand-traced pseudo-logos and fabricated color/initial
  // approximations this rewrite removes. Their reappearance here would mean
  // a fake mark crept back in.
  for (const marker of [
    'GoldenArches',
    'PepsiGlobe',
    'ShellLogo',
    'ToyotaRings',
    'NikeSwoosh',
    'AppleGlyph',
    'MetaInfinity',
    'AltriaGrid',
    'MastercardRings',
    'BRAND_LOGOS',
    "'coca-cola'",
    "'plan b media'",
  ]) {
    assert.ok(!source.includes(marker), `BrandBadge.jsx must not reintroduce "${marker}"`);
  }
});
