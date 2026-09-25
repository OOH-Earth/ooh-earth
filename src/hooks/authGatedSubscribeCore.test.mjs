import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldOpenSubscription, subscribeToEntity } from './authGatedSubscribeCore.js';

// --- shouldOpenSubscription: the actual anonymous/authenticated gate ---

test('A. anonymous (authChecked, not authenticated) -- does not open', () => {
  assert.equal(shouldOpenSubscription(true, false, 'Location'), false);
});

test('B. authenticated (authChecked, authenticated) -- opens', () => {
  assert.equal(shouldOpenSubscription(true, true, 'Location'), true);
});

test('C. auth-loading (not yet authChecked) -- does not open, even if isAuthenticated is already true', () => {
  assert.equal(shouldOpenSubscription(false, false, 'Location'), false);
  assert.equal(shouldOpenSubscription(false, true, 'Location'), false);
});

test("entityName not yet resolved (e.g. a required prop like `location` hasn't loaded) -- does not open, even when authenticated", () => {
  assert.equal(shouldOpenSubscription(true, true, null), false);
  assert.equal(shouldOpenSubscription(true, true, undefined), false);
  assert.equal(shouldOpenSubscription(true, true, ''), false);
});

// --- subscribeToEntity: the actual subscribe-or-noop call ---

test('F. authenticated + entity present -- calls entities[name].subscribe(callback) exactly once and returns its unsub', () => {
  let calls = 0;
  let receivedCallback = null;
  const unsubSpy = () => {};
  const entities = {
    Location: {
      subscribe: (cb) => {
        calls += 1;
        receivedCallback = cb;
        return unsubSpy;
      },
    },
  };
  const callback = () => {};
  const unsub = subscribeToEntity(entities, 'Location', callback);

  assert.equal(calls, 1);
  assert.equal(receivedCallback, callback);
  assert.equal(unsub, unsubSpy);
});

test('E. entity missing from the SDK client -- returns a safe no-op instead of throwing', () => {
  const unsub = subscribeToEntity({}, 'Location', () => {});
  assert.equal(typeof unsub, 'function');
  assert.doesNotThrow(() => unsub());
});

test('entity present but has no subscribe method -- returns a safe no-op instead of throwing', () => {
  const unsub = subscribeToEntity({ Location: {} }, 'Location', () => {});
  assert.equal(typeof unsub, 'function');
  assert.doesNotThrow(() => unsub());
});

test('entities container itself is null/undefined -- returns a safe no-op instead of throwing', () => {
  assert.doesNotThrow(() => subscribeToEntity(null, 'Location', () => {}));
  assert.doesNotThrow(() => subscribeToEntity(undefined, 'Location', () => {}));
});

test('subscribe() returning a non-function unsub -- falls back to a safe no-op', () => {
  const entities = { Location: { subscribe: () => null } };
  const unsub = subscribeToEntity(entities, 'Location', () => {});
  assert.equal(typeof unsub, 'function');
  assert.doesNotThrow(() => unsub());
});

// D (logout/cleanup unsubscribes) and the re-render/duplicate-subscription
// behavior (E in the task's own list) are properties of the React
// useEffect wiring around these two pure functions -- specifically, that
// the effect's dependency array is exactly [authChecked, isAuthenticated,
// entityName] (no callback identity in it, so a re-render with a fresh
// inline callback never tears down/recreates the subscription) and that
// React always runs the previous cleanup (the returned unsub) before
// re-running the effect on any of those three inputs changing (including
// isAuthenticated flipping to false on logout). This repo has no
// React-hook test harness (no @testing-library/react / jsdom in
// devDependencies -- confirmed via package.json), so those properties are
// verified by code review of useAuthGatedSubscribe.js's effect body/deps
// plus live BACKUP DevTools verification (see
// docs/ops/ooh-earth/05-TEST-MATRIX.md), not a unit test here.
