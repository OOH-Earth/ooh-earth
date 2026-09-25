import { writeFileSync } from 'node:fs';

export function redactCliOutput(value) {
  return String(value || '')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[REDACTED]')
    .replace(/((?:token|secret|password|api[_-]?key)\s*[=:]\s*)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT]');
}

export function assertBuildArtifact(exists) {
  if (!exists) {
    throw new Error('Build artifact missing: run `npm run build` before deployment');
  }
}

export function writeReleaseManifestArtifact(path, manifest) {
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
}
