#!/usr/bin/env node
// Generates a static, crawler-visible copy of dist/index.html for every
// static route in src/lib/routeMeta.js, with the real per-route <title>,
// canonical, Open Graph, and Twitter Card tags already baked in.
//
// Why this exists: OOH Earth is a pure client-rendered SPA (no SSR/prerender
// plugin). src/lib/seoContext.jsx already applies correct per-route metadata
// to `document.head` after React mounts — real browsers and JS-executing
// crawlers (e.g. Googlebot) see it fine. Social-preview bots (Facebook,
// Twitter/X, LinkedIn, Slack, Discord, iMessage) do not execute JavaScript;
// they only ever see dist/index.html's static defaults, identical on every
// route. Empirically confirmed via `curl` against a built+served dist: every
// route returned the same generic homepage <title>/og:title.
//
// This script does not replace seoContext.jsx — it gives static hosts a
// matching file to serve at each route path *before* falling back to the
// SPA catch-all rewrite to /index.html, the same technique tools like
// react-snap/vite-plugin-ssg use. Whether OOH Earth's actual host (Base44)
// serves an exact-path file ahead of its SPA rewrite is NOT verified here —
// see docs/BASE44_ARCHITECTURE_AND_ACCESS.md.
//
// Only routes with static, build-time-known metadata are covered (the exact
// keys in routeMeta.js's META table). Dynamic entity routes (/location/:id,
// /store/:id, /blog/:id, /bus-stop/:id) are NOT prerendered — their metadata
// depends on live Base44 data unavailable at build time in this repo.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { META } from '../src/lib/routeMeta.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const templatePath = path.join(distDir, 'index.html');
const SITE_URL = 'https://oohearth.app';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyMeta(html, route, meta) {
  const url = `${SITE_URL}${route}`;
  const title = escapeHtml(meta.title);
  const desc = escapeHtml(meta.desc);
  const image = escapeHtml(meta.image);

  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  out = out.replace(/rel="canonical"\s+href="[^"]*"/, `rel="canonical" href="${url}"`);
  out = out.replace(/name="description"\s+content="[^"]*"/, `name="description" content="${desc}"`);
  out = out.replace(/property="og:url" content="[^"]*"/, `property="og:url" content="${url}"`);
  out = out.replace(
    /property="og:title" content="[^"]*"/,
    `property="og:title" content="${title}"`,
  );
  out = out.replace(
    /property="og:description"\s+content="[^"]*"/,
    `property="og:description" content="${desc}"`,
  );
  out = out.replace(
    /property="og:image" content="[^"]*"/,
    `property="og:image" content="${image}"`,
  );
  out = out.replace(
    /name="twitter:title" content="[^"]*"/,
    `name="twitter:title" content="${title}"`,
  );
  out = out.replace(
    /name="twitter:description"\s+content="[^"]*"/,
    `name="twitter:description" content="${desc}"`,
  );
  out = out.replace(
    /name="twitter:image" content="[^"]*"/,
    `name="twitter:image" content="${image}"`,
  );
  return out;
}

async function main() {
  // Read directly rather than check-then-read (existsSync + readFile on the
  // same path is a TOCTOU race) -- a missing file surfaces as ENOENT here.
  let template;
  try {
    template = await readFile(templatePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('prerender-meta: dist/index.html not found — run `vite build` first.');
      process.exit(1);
    }
    throw err;
  }
  const routes = Object.keys(META).filter((r) => r !== '/');

  let written = 0;
  for (const route of routes) {
    const meta = META[route];
    const html = applyMeta(template, route, meta);
    const outDir = path.join(distDir, route.replace(/^\//, ''));
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, 'index.html'), html, 'utf8');
    written += 1;
  }

  // Root route: align with the same source of truth so index.html and
  // routeMeta.js's '/' entry can never drift apart again.
  const rootHtml = applyMeta(template, '/', META['/']);
  await writeFile(templatePath, rootHtml, 'utf8');

  console.log(`prerender-meta: wrote ${written} static route(s) + refreshed the root index.html`);
}

main();
