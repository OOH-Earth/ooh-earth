import test from 'node:test';
import assert from 'node:assert/strict';
import { countBrands, normalizeBrandName } from './brandCounts.js';

test('empty, missing and non-array input give no brands', () => {
  assert.deepEqual(countBrands([]), []);
  assert.deepEqual(countBrands(null), []);
  assert.deepEqual(countBrands(undefined), []);
  assert.deepEqual(
    countBrands([null, {}, { brand_name: '' }, { brand_name: '   ' }, { brand_name: 7 }]),
    [],
  );
});

test('counts duplicates and folds case/whitespace without merging aliases', () => {
  const out = countBrands([
    { brand_name: 'Coca-Cola' },
    { brand_name: ' coca-cola ' },
    { brand_name: 'COCA-COLA' },
    { brand_name: 'Coca Cola' },
    { brand_name: 'Shell' },
    { brand_name: 'Shell' },
  ]);
  assert.deepEqual(out, [
    { brand: 'Coca-Cola', count: 3 },
    { brand: 'Shell', count: 2 },
    { brand: 'Coca Cola', count: 1 },
  ]);
});

test('ignores titles/notes and rejected records; unknown brands are not guessed', () => {
  const out = countBrands([
    { title: 'McDonalds billboard', notes: 'Nestle ad', brand_name: undefined },
    { brand_name: 'BP', status: 'rejected' },
    { brand_name: 'BP', status: 'pending' },
    { brand_name: 'BP', status: 'verified' },
  ]);
  assert.deepEqual(out, [{ brand: 'BP', count: 2 }]);
});

test('ties sort alphabetically; limit applies; input is not mutated', () => {
  const input = ['b', 'a', 'c', 'd'].map((brand_name) => ({ brand_name }));
  const copy = JSON.stringify(input);
  assert.deepEqual(
    countBrands(input, { limit: 2 }).map((x) => x.brand),
    ['a', 'b'],
  );
  assert.equal(JSON.stringify(input), copy);
});

test('normalizeBrandName', () => {
  assert.equal(normalizeBrandName('  A   B '), 'A B');
  assert.equal(normalizeBrandName(null), null);
});
