import { base44 } from '@/api/base44Client';
import { classifyQueueItem, ownerForNewItem } from '@/lib/queueIdentity';

const DB_NAME = 'ooh_offline';
const STORE = 'captures';
const MAX_RETRIES = 5;
// A send that has not answered within this window is no longer assumed to be running in
// another tab, so it may be reconciled. The server decides whether anything is created.
const IN_FLIGHT_MS = 90 * 1000;
// Items written by this version carry a server ticket. Older items do not.
const DRAFT_VERSION = 2;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 3);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
      const store = req.transaction.objectStore(STORE);
      if (!store.indexNames.contains('operation_id'))
        store.createIndex('operation_id', 'operation_id', { unique: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function notify() {
  window.dispatchEvent(new CustomEvent('ooh-queue-changed'));
}

// Sends this tab is running right now: not offered as "saved drafts" while they are.
const activeSends = new Set();
export const isSendingHere = (item) => activeSends.has(item.operation_id);

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function operationId(payload) {
  return payload?.client_operation_id || randomId();
}

function withOperationId(payload) {
  const target = payload || {};
  if (!target.client_operation_id) target.client_operation_id = operationId(target);
  return target;
}

export class DeliveryPendingError extends Error {
  constructor() {
    super('Delivery is still being confirmed.');
    this.name = 'DeliveryPendingError';
    this.pending = true;
  }
}

// A refusal that sending again cannot change.
export function isPermanentRejection(error) {
  const status = error?.status ?? error?.response?.status;
  const code = error?.data?.code ?? error?.response?.data?.code;
  if (status === 422 || status === 403) return true;
  return status === 409 && code !== 'IDENTITY_MISMATCH';
}

async function invokeSubmit(body) {
  const response = await base44.functions.invoke('submitOffline', body);
  return response?.data ?? response;
}

async function submitRemote(payload, entityType, ticketId) {
  const body = { entity_type: entityType, payload };
  if (ticketId) body.ticket_id = ticketId;
  const result = await invokeSubmit(body);
  if (result?.pending) throw new DeliveryPendingError();
  if (!result?.ok || !result.record) throw new Error('Submission unavailable');
  return result.record;
}

// Changes one stored item inside a single transaction, which the browser serialises across
// tabs. Returns the item as stored afterwards, or null if it no longer exists.
async function patchItem(id, change) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    let result = null;
    const get = store.get(id);
    get.onsuccess = () => {
      const item = get.result;
      if (!item) return;
      change(item);
      result = item;
      store.put(item);
    };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// Sends one saved item. A ticket is reserved once and stored before the send; every tab and
// every later attempt reuses it, and the server creates at most one record for it.
export async function deliverItem(item) {
  // Saved by an older version: it may already have been received, and the server's
  // ticketless path is the one that looks for it.
  if (item.version !== DRAFT_VERSION) return submitRemote(item.payload, item.entityType);
  let ticketId = item.ticket_id;
  if (!ticketId) {
    const reserved = await invokeSubmit({
      action: 'reserve',
      entity_type: item.entityType,
      operation_id: item.operation_id,
    });
    if (!reserved?.ticket_id) throw new Error('Submission unavailable');
    if (item.id === undefined) ticketId = reserved.ticket_id;
    else {
      const stored = await patchItem(item.id, (current) => {
        current.ticket_id ??= reserved.ticket_id;
      });
      if (!stored) return null; // discarded or already sent by another tab
      ticketId = stored.ticket_id;
    }
    item.ticket_id = ticketId;
  }
  if (item.id !== undefined)
    await patchItem(item.id, (current) => {
      current.sending_since = Date.now();
    });
  return submitRemote(item.payload, item.entityType, ticketId);
}

// True if the item may be sent automatically right now.
export function isSendable(item, now = Date.now()) {
  if (item.status === 'failed') return false;
  if (item.sending_since && now - item.sending_since < IN_FLIGHT_MS) return false;
  // Older items keep their earlier behaviour; newer ones only go out as their author.
  return item.version !== DRAFT_VERSION || classifyQueueItem(item) === 'own';
}

export async function enqueueCapture(payload, entityType = 'Location', extra = {}) {
  const normalized = withOperationId(payload);
  const db = await openDB();
  const existing = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).index('operation_id').get(normalized.client_operation_id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
  if (existing) return existing;
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).add({
        payload: normalized,
        operation_id: normalized.client_operation_id,
        entityType,
        created: Date.now(),
        retries: 0,
        version: DRAFT_VERSION,
        owner: ownerForNewItem(),
        ...extra,
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    if (error?.name !== 'ConstraintError') throw error;
    return (await listCaptures()).find(
      (item) => item.operation_id === normalized.client_operation_id,
    );
  }
  notify();
}

export async function listCaptures() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removeCapture(id) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  notify();
}

// Hands a never-attempted draft to whoever is using the app now, at their explicit request.
// A draft with a ticket may already have been received under its author, so it is not moved.
export async function adoptCapture(id, owner) {
  await patchItem(id, (item) => {
    if (!item.ticket_id) item.owner = owner;
  });
  notify();
}

export async function markFailed(id, reason) {
  await patchItem(id, (item) => {
    item.status = 'failed';
    item.failure = reason;
    delete item.sending_since;
  });
  notify();
}

// Releases an item for a later attempt without counting it as a failed retry.
export async function markWaiting(id) {
  await patchItem(id, (item) => {
    delete item.sending_since;
  });
  notify();
}

export async function incrementRetries(id) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const rec = getReq.result;
      if (!rec) return resolve();
      rec.retries = (rec.retries || 0) + 1;
      delete rec.sending_since;
      // Automatic retries are exhausted at MAX_RETRIES, but the captured
      // evidence is not discarded -- mark it 'failed' instead of deleting
      // so it stays visible and locally recoverable via retryCapture()
      // below. Previously this branch called store.delete(id), silently
      // destroying a user's offline field report with no failure
      // indication at all.
      if (rec.retries >= MAX_RETRIES) rec.status = 'failed';
      // Bug fixed alongside the above: this put request's own onsuccess/
      // onerror were never wired up, so this promise never resolved or
      // rejected on the normal (record-found) path -- confirmed live via
      // console instrumentation, not assumed from reading the code. Every
      // failed sync hung flush() forever on its very first failure,
      // permanently disabling the retry button (stuck syncing:true) and
      // blocking the rest of the queue loop from ever reaching later
      // items, since the for-of loop awaits this call sequentially.
      const putReq = store.put(rec);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
  notify();
}

// Explicit user-initiated retry for an item that already exhausted
// automatic retries. Not looped or timer-driven -- the automatic flush
// path (useOfflineSync's flush()) deliberately excludes 'failed' items so
// they don't hammer the backend forever; this is the only path back to
// synced, at the user's own pace.
export async function retryCapture(id) {
  const db = await openDB();
  const rec = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
  if (!rec) return { status: 'missing' };
  try {
    // Safe to resend even if an earlier attempt did arrive: the stored ticket (or, for
    // older items, the operation id) leads the server to the original record.
    await deliverItem(rec);
    await removeCapture(id);
    return { status: 'synced' };
  } catch (err) {
    console.warn('Manual retry failed for item', id, err?.message);
    await markWaiting(id);
    // Stays 'failed' -- still visible, still recoverable, no further
    // automatic action taken.
    return { status: 'failed' };
  }
}

// Saves the draft on the device before the first send, so a reload, a closed tab or a lost
// response leaves something to reconcile with the same identity.
async function submitDraft(payload, entityType) {
  const normalized = withOperationId(payload);
  const online = navigator.onLine;
  let item = null;
  if (online) activeSends.add(normalized.client_operation_id);
  try {
    await enqueueCapture(normalized, entityType, online ? { sending_since: Date.now() } : {});
    item = (await listCaptures()).find(
      (saved) => saved.operation_id === normalized.client_operation_id,
    );
  } catch (error) {
    // Reported to the person only if the send does not succeed either.
    console.warn('Could not save a draft on this device:', error?.name);
  }
  const notSaved = () =>
    new Error(
      'Not sent, and this device could not save a copy (storage unavailable or full). Keep this open and try again.',
    );
  if (!online) {
    if (!item) throw notSaved();
    return { status: 'queued' };
  }
  const attempt = item ?? {
    payload: normalized,
    operation_id: normalized.client_operation_id,
    entityType,
    version: DRAFT_VERSION,
  };
  try {
    const rec = await deliverItem(attempt);
    // A send that arrived is complete even if clearing the draft fails.
    activeSends.delete(normalized.client_operation_id);
    if (item) await removeCapture(item.id).catch(() => {});
    return { status: 'synced', rec: { lat: normalized.lat, lng: normalized.lng, ...rec } };
  } catch (err) {
    activeSends.delete(normalized.client_operation_id);
    if (isPermanentRejection(err)) {
      // The form is still open with its contents: report it there instead of keeping a draft.
      if (item) await removeCapture(item.id).catch(() => {});
      throw new Error('The server refused this submission. Check the details and try again.');
    }
    console.warn('Delivery not confirmed, keeping the draft:', err?.message);
    if (!item) throw notSaved();
    await markWaiting(item.id);
    return { status: 'queued' };
  }
}

export async function submitCapture(payload) {
  return submitDraft(payload, 'Location');
}

export async function submitFieldCheck(payload) {
  return submitDraft(payload, 'FieldCheck');
}

export { MAX_RETRIES };
