import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Regression gate, not a pass/fail bar: this legacy app has known WCAG
// violations (see a11y-baseline.json, captured live the day this gate was
// added). CI fails only when a route regresses — a new rule ID appears, or
// an existing one's node count grows — matching the pipeline brief's
// "accessibility score drops" quality gate. Fixing the pre-existing debt is
// an app-level design/contrast decision, out of scope here (Decision Register).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseline: Record<string, Record<string, number>> = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'a11y-baseline.json'), 'utf-8'),
);

const ROUTES = Object.keys(baseline).filter((k) => !k.startsWith('_'));

for (const route of ROUTES) {
  test(`accessibility scan: ${route}`, async ({ page }, testInfo) => {
    await page.goto(route);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    const current: Record<string, number> = {};
    for (const v of results.violations) current[v.id] = v.nodes.length;

    await testInfo.attach('axe-violations.json', {
      body: JSON.stringify({ route, violations: current }, null, 2),
      contentType: 'application/json',
    });

    const known = baseline[route] ?? {};
    const regressions: string[] = [];

    for (const [ruleId, count] of Object.entries(current)) {
      const allowed = known[ruleId] ?? 0;
      if (count > allowed) {
        regressions.push(`${ruleId}: ${count} nodes (baseline allows ${allowed})`);
      }
    }

    expect(regressions, `Accessibility regressed on ${route}:\n${regressions.join('\n')}`).toEqual(
      [],
    );
  });
}
