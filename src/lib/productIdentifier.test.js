import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProductIdentifier } from './productIdentifier.js';

test('validates supported UPC/EAN identifiers and preserves acquisition source', () => {
  assert.equal(normalizeProductIdentifier('036000291452', { source: 'manual' }).valid, true);
  assert.equal(normalizeProductIdentifier('3017620422003', { source: 'manual' }).valid, true);
  assert.equal(normalizeProductIdentifier('96385074', { source: 'manual' }).valid, true);
  assert.equal(normalizeProductIdentifier('036000291452', { source: 'manual' }).symbology, 'upc_a');
  assert.equal(normalizeProductIdentifier('3017620422003').symbology, 'ean_13');
});

test('rejects invalid checksums and non-digit input before lookup', () => {
  assert.equal(normalizeProductIdentifier('036000291453').reason, 'invalid_checksum');
  assert.equal(normalizeProductIdentifier('3017620422002').reason, 'invalid_checksum');
  assert.equal(normalizeProductIdentifier('96385075').reason, 'invalid_checksum');
  assert.equal(normalizeProductIdentifier('1234-5678').reason, 'digits_only_required');
  assert.equal(normalizeProductIdentifier('1234567').reason, 'invalid_checksum');
});

test('normalizes a valid UPC-E to a provider-safe UPC-A', () => {
  const result = normalizeProductIdentifier('04210007', { symbology: 'upc_e', source: 'camera' });
  assert.equal(result.valid, true);
  assert.equal(result.canonical, '042000001007');
  assert.equal(result.source, 'camera');
});
