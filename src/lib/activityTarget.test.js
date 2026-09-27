import test from 'node:test';
import assert from 'node:assert/strict';
import { activityTargetPath } from './activityTarget.js';

test('a new Location links to its own detail page', () => {
  assert.equal(
    activityTargetPath('Location', { type: 'create', id: 'abc123', data: {} }),
    '/location/abc123',
  );
});

test('a LeadClaim links to the place that was adopted, not the claimant', () => {
  assert.equal(
    activityTargetPath('LeadClaim', {
      type: 'create',
      id: 'claim1',
      data: { location_id: 'loc9', operative_handle: 'ghost' },
    }),
    '/location/loc9',
  );
});

test('events with no public place stay non-interactive', () => {
  assert.equal(activityTargetPath('DigitalBust', { type: 'create', id: 'b1', data: {} }), null);
  assert.equal(activityTargetPath('FundingLead', { type: 'create', id: 'f1', data: {} }), null);
  assert.equal(activityTargetPath('LeadClaim', { type: 'create', id: 'c1', data: {} }), null);
});

test('only create events produce a link', () => {
  assert.equal(activityTargetPath('Location', { type: 'update', id: 'abc123' }), null);
  assert.equal(activityTargetPath('Location', { type: 'delete', id: 'abc123' }), null);
  assert.equal(activityTargetPath('Location', null), null);
});

test('malformed ids never become a path', () => {
  assert.equal(activityTargetPath('Location', { type: 'create', id: '../admin' }), null);
  assert.equal(activityTargetPath('Location', { type: 'create', id: 42 }), null);
  assert.equal(activityTargetPath('Location', { type: 'create', id: '' }), null);
});
