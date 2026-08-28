import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const appId = '6a62213cff3ccbca88c04ff5';
const source = readFileSync('src/lib/app-params.js', 'utf8');
if (!source.includes('import.meta.env.PROD ? PRODUCTION_APP_ID')) {
  throw new Error('production app-ID fallback is missing');
}

const env = { ...process.env };
delete env.VITE_BASE44_APP_ID;
delete env.VITE_BASE44_APP_BASE_URL;
delete env.VITE_BASE44_FUNCTIONS_VERSION;
execFileSync('npm', ['run', 'build'], { stdio: 'inherit', env });

const assets = readdirSync('dist/assets').filter(name => name.endsWith('.js'));
const bundle = assets.map(name => readFileSync(join('dist/assets', name), 'utf8')).join('\n');
if (!bundle.includes(appId)) throw new Error('production bundle does not contain the verified app ID');
if (bundle.includes('/api/apps/null/')) throw new Error('production bundle contains null app API path');
if (!existsSync('dist/index.html')) throw new Error('production build output is missing');

console.log('PRODUCTION_BINDING_REGRESSION_PASS');
