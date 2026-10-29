import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const cfg = readFileSync(new URL('../../tailwind.config.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

const lum = ([r, g, b]) => {
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const rgb = (name, scope) => {
  const block = scope === 'light' ? css.slice(css.indexOf('.light {')) : css;
  return block
    .match(new RegExp(`--${name}:\\s*(\\d+) (\\d+) (\\d+);`))
    .slice(1, 4)
    .map(Number);
};

test('type roles are rem based (they follow browser text size) with a line-height', () => {
  for (const [k, size] of [
    ['ooh-caption', '0.75rem'],
    ['ooh-control', '0.875rem'],
    ['ooh-body', '1rem'],
    ['ooh-section', '1.125rem'],
  ]) {
    assert.match(
      cfg,
      new RegExp(`'${k}': \\['${size.replace('.', '\\.')}', \\{ lineHeight: '1\\.\\d+' \\}\\]`),
      k,
    );
  }
  assert.match(cfg, /'ooh-page': \['clamp\(1\.5rem/);
  assert.match(cfg, /quiet: 'rgb\(var\(--c-quiet\)/);
});

test('--c-quiet meets 4.5:1 on void and card in both themes; legacy --c-dim does not (dark)', () => {
  assert.ok(ratio(rgb('c-quiet'), rgb('c-void')) >= 4.5);
  assert.ok(ratio(rgb('c-quiet'), [10, 10, 10]) >= 4.5);
  const light = css.slice(css.indexOf('.light {'));
  const q = light
    .match(/--c-quiet:\s*(\d+) (\d+) (\d+);/)
    .slice(1, 4)
    .map(Number);
  const v = light
    .match(/--c-void:\s*(\d+) (\d+) (\d+);/)
    .slice(1, 4)
    .map(Number);
  assert.ok(ratio(q, v) >= 4.5);
  assert.ok(ratio(rgb('c-dim'), rgb('c-void')) < 4.5, 'documents why a new role exists');
});

test('target role is 44px at the default root size', () => {
  assert.match(css, /--ooh-target:\s*2\.75rem;/);
});
