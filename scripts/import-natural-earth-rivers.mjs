import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { format } from 'prettier';

// Reproducible offline import. Download the pinned public-domain data separately; never track master.
const commit = 'ca96624a56bd078437bca8184e78163e5039ad19';
const path = 'geojson/ne_50m_rivers_lake_centerlines.geojson';
const expected = 'f286e0ce978fde999ca2d7a78c764be08542e19b63cded52b05c12d5173ccc51';
const input = process.argv[2];
if (!input)
  throw new Error('Usage: node scripts/import-natural-earth-rivers.mjs LOCAL_UPSTREAM_FILE');
const bytes = await readFile(input);
const hash = (data) => createHash('sha256').update(data).digest('hex');
if (hash(bytes) !== expected) throw new Error('Pinned upstream SHA-256 mismatch; import refused');
const source = JSON.parse(bytes.toString('utf8'));
if (source.type !== 'FeatureCollection' || !Array.isArray(source.features))
  throw new Error('Invalid source');
const features = source.features
  .filter(
    (f) => f.properties?.featurecla === 'River' && f.properties.scalerank <= 5 && f.properties.name,
  )
  .map((f) => {
    if (!['LineString', 'MultiLineString'].includes(f.geometry.type))
      throw new Error('Invalid geometry');
    const lines =
      f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
    if (
      !lines.every(
        (line) =>
          line.length >= 2 &&
          line.every(
            (p) =>
              p.length === 2 &&
              p.every(Number.isFinite) &&
              Math.abs(p[0]) <= 180 &&
              Math.abs(p[1]) <= 90,
          ),
      )
    )
      throw new Error('Invalid coordinates');
    return {
      type: 'Feature',
      properties: {
        name: f.properties.name_en || f.properties.name,
        scalerank: f.properties.scalerank,
      },
      geometry: f.geometry,
    };
  });
if (features.length !== 194)
  throw new Error('Unexpected feature count; review the source before updating');
const output = JSON.stringify({ type: 'FeatureCollection', features }) + '\n';
const provenance = {
  repository: 'https://github.com/nvkelso/natural-earth-vector',
  commit,
  path,
  upstreamUrl: `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${commit}/${path}`,
  upstreamSha256: expected,
  datasetSha256: hash(output),
  licence: 'public domain',
  filter: 'featurecla=River; scalerank<=5; named; name_en preferred',
  features: features.length,
  coordinates: 'Preserved exactly as supplied upstream; no rounding, thinning or inferred vertices',
  accuracy: 'Generalised 1:50m reference cartography; positional accuracy not specified; not live',
};
await writeFile('src/components/ooh/environment/data/naturalEarthRivers.json', output);
await writeFile(
  'src/components/ooh/environment/data/naturalEarthRivers.source.json',
  await format(JSON.stringify(provenance), { parser: 'json' }),
);
console.log(`Imported ${features.length} sourced river features: ${provenance.datasetSha256}`);
