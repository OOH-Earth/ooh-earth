import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIELD_RECORD_MAX, fieldRecordDateLabel, fieldRecordEntries } from './fieldRecord.js';

test('non-array input yields an empty record', () => {
  assert.deepEqual(fieldRecordEntries(undefined), []);
  assert.deepEqual(fieldRecordEntries(null), []);
  assert.deepEqual(fieldRecordEntries({ id: 'a' }), []);
  assert.deepEqual(fieldRecordEntries([]), []);
});

test('a valid record links to the public Location Detail page', () => {
  const [e] = fieldRecordEntries([
    { id: 'loc_1', title: 'Old Street Wall', type: 'mural', created_date: '2026-05-12' },
  ]);
  assert.deepEqual(e, {
    id: 'loc_1',
    href: '/location/loc_1',
    title: 'Old Street Wall',
    type: 'mural',
    typeLabel: 'Mural',
    date: '2026-05-12',
    dateLabel: '12 MAY 2026',
  });
});

test('unsafe or missing ids are dropped so no unsafe href is ever built', () => {
  const out = fieldRecordEntries([
    { id: '../admin' },
    { id: 'a/b' },
    { id: 'x?y=1' },
    { id: '' },
    { id: 42 },
    { title: 'no id' },
    null,
    'string',
    { id: 'ok' },
  ]);
  assert.deepEqual(
    out.map((e) => e.href),
    ['/location/ok'],
  );
});

test('malformed fields fall back safely', () => {
  const [e] = fieldRecordEntries([
    { id: 'a', title: '   ', type: 'spaceship', created_date: '2026-13-40' },
  ]);
  assert.equal(e.title, 'Untitled place');
  assert.equal(e.type, 'other');
  assert.equal(e.typeLabel, 'Other');
  assert.equal(e.date, '2026-13-40');
  assert.equal(e.dateLabel, null);
  const [f] = fieldRecordEntries([{ id: 'b', created_date: '2026-05-12T10:11:12Z' }]);
  assert.equal(f.date, null, 'only day-precision dates are accepted');
  assert.equal(f.dateLabel, null);
});

test('the record is capped and de-duplicated client-side too', () => {
  const many = Array.from({ length: 9 }, (_, i) => ({ id: `l${i}`, title: `P${i}` }));
  assert.equal(fieldRecordEntries(many).length, FIELD_RECORD_MAX);
  assert.deepEqual(
    fieldRecordEntries([{ id: 'x' }, { id: 'x' }, { id: 'y' }]).map((e) => e.id),
    ['x', 'y'],
  );
});

test('only allowlisted fields are carried through', () => {
  const [e] = fieldRecordEntries([
    { id: 'a', title: 'T', type: 'billboard', lat: 51.5, lng: -0.1, created_by_id: 'u1' },
  ]);
  assert.deepEqual(Object.keys(e).sort(), [
    'date',
    'dateLabel',
    'href',
    'id',
    'title',
    'type',
    'typeLabel',
  ]);
});

test('date label is timezone-independent', () => {
  assert.equal(fieldRecordDateLabel('2026-01-01'), '1 JAN 2026');
  assert.equal(fieldRecordDateLabel('2026-12-31'), '31 DEC 2026');
  assert.equal(fieldRecordDateLabel(null), null);
});
