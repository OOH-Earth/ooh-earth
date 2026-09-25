#!/usr/bin/env node
// Rasterizes public/brand/oohearth-mark.svg into the PNG sizes iOS/Android/
// PWA installs actually need. KNOWN_ISSUES.md #11/#12: manifest.json only
// ever shipped one SVG icon ("sizes: any") and the apple-touch-icon was an
// inline SVG data URI -- iOS Safari does not rasterize SVG for home-screen
// icons and silently ignores it, and Android/Lighthouse PWA installability
// checks want real PNGs at standard sizes. Previously blocked on no image
// tooling being available (no ImageMagick/sharp/rsvg in prior environments)
// -- Playwright (already a devDependency here, used for e2e) can rasterize
// an SVG via a real headless-Chromium screenshot, so no new dependency is
// needed.
//
// Usage: node scripts/generate-app-icons.mjs
// Regenerate whenever public/brand/oohearth-mark.svg changes.

import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const svgPath = path.join(root, 'public/brand/oohearth-mark.svg');
const outDir = path.join(root, 'public/brand');

// 180: apple-touch-icon (iOS home screen). 192/512: manifest.json standard
// PWA install sizes (192 for the install prompt/app list, 512 for splash
// screens and higher-density displays).
const SIZES = [180, 192, 512];

const svg = readFileSync(svgPath, 'utf8');

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
for (const size of SIZES) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<!doctype html><html><head><style>
      html,body{margin:0;padding:0}
      svg{display:block;width:${size}px;height:${size}px}
    </style></head><body>${svg}</body></html>`,
  );
  const outPath = path.join(outDir, `oohearth-mark-${size}.png`);
  await page.screenshot({ path: outPath });
  console.log(`generate-app-icons: wrote ${path.relative(root, outPath)}`);
  await page.close();
}
await browser.close();
