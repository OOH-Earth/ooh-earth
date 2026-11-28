// Which identity the on-device offline queue currently belongs to.
//
// A queued report is saved on the device with the identity that wrote it
// (`owner`). The queue must never send it under a different identity on its own:
// the server records created_by from the live session, so an anonymous draft
// flushed after sign-in (or one account's draft after an account switch) would
// silently become the other identity's report.
const HINT_KEY = 'ooh_queue_identity_hint';
export const ANONYMOUS = 'anonymous';

let state = { id: null, confirmed: false };

export function getQueueIdentity() {
  return state;
}

// id: the signed-in user's id, or null/undefined for an anonymous visitor.
// confirmed=false when the auth check could not complete (e.g. offline at load):
// the queue then sends nothing, but new items are still tagged from the hint.
export function setQueueIdentity(id, { confirmed = true } = {}) {
  state = { id: id ? String(id) : ANONYMOUS, confirmed };
  if (confirmed) {
    try {
      localStorage.setItem(HINT_KEY, state.id);
    } catch {
      /* storage unavailable -- the hint is best effort */
    }
  }
  if (typeof window !== 'undefined')
    window.dispatchEvent(new CustomEvent('ooh-queue-identity-changed'));
}

// Marks the identity as unknown (auth check failed without an answer).
export function setQueueIdentityUnresolved() {
  state = { id: state.id, confirmed: false };
  if (typeof window !== 'undefined')
    window.dispatchEvent(new CustomEvent('ooh-queue-identity-changed'));
}

// Owner tag for a NEW queued item. May be null (unknown) -- such an item is held
// like a legacy one rather than guessed.
export function ownerForNewItem() {
  if (state.id) return state.id;
  try {
    return localStorage.getItem(HINT_KEY) || null;
  } catch {
    return null;
  }
}

// 'own'        -- saved by the current identity: may be sent automatically.
// 'adoptable'  -- saved anonymously (or by an unknown/legacy session) and now a
//                 signed-in user is here, or a legacy item and the visitor is
//                 anonymous: held until the person explicitly chooses to send it.
// 'foreign'    -- saved by a different signed-in account: never sendable here.
// 'unresolved' -- identity not confirmed yet: nothing is sent.
export function classifyQueueItem(item, identity = state) {
  if (!identity?.confirmed || !identity.id) return 'unresolved';
  const owner = item?.owner ?? null;
  if (owner === identity.id) return 'own';
  if (identity.id === ANONYMOUS) return owner === null ? 'adoptable' : 'foreign';
  return owner === ANONYMOUS || owner === null ? 'adoptable' : 'foreign';
}

export class IdentityChangedError extends Error {
  constructor() {
    super('The signed-in identity changed; the queued report was not sent.');
    this.name = 'IdentityChangedError';
    this.identityChanged = true;
  }
}

// True only if, RIGHT NOW, the confirmed identity is still `expectedId` and the
// item belongs to it. Called immediately before every send so a sign-out or
// account switch that happens during a sync never lets a draft go out under the
// new identity. (The server derives ownership from the live session on its own;
// this guard only decides whether to send at all.)
export function canSendNow(item, expectedId) {
  const identity = state;
  return (
    identity.confirmed && identity.id === expectedId && classifyQueueItem(item, identity) === 'own'
  );
}
