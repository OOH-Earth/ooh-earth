import { base44 } from '@/api/base44Client';

const DB_NAME = 'ooh_offline';
const STORE = 'captures';
const MAX_RETRIES = 5;

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

function operationId(payload) {
  return (
    payload?.client_operation_id ||
    (globalThis.crypto?.randomUUID?.() ??
      `ooh-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  );
}

function withOperationId(payload) {
  const target = payload || {};
  if (!target.client_operation_id) target.client_operation_id = operationId(target);
  return target;
}

async function submitRemote(payload, entityType) {
  const response = await base44.functions.invoke('submitOffline', {
    entity_type: entityType,
    payload,
  });
  const result = response?.data ?? response;
  if (!result?.ok || !result.record) throw new Error('Submission unavailable');
  return result.record;
}

export async function enqueueCapture(payload, entityType = 'Location') {
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
      if (rec.retries >= MAX_RETRIES) {
        store.delete(id);
      } else {
        store.put(rec);
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
  notify();
}

export async function submitCapture(payload) {
  const normalized = withOperationId(payload);
  if (!navigator.onLine) {
    await enqueueCapture(normalized, 'Location');
    return { status: 'queued' };
  }
  try {
    const rec = await submitRemote(normalized, 'Location');
    return { status: 'synced', rec };
  } catch (err) {
    console.warn('Capture failed, queuing:', err?.message);
    await enqueueCapture(normalized, 'Location');
    return { status: 'queued' };
  }
}

export async function submitFieldCheck(payload) {
  const normalized = withOperationId(payload);
  if (!navigator.onLine) {
    await enqueueCapture(normalized, 'FieldCheck');
    return { status: 'queued' };
  }
  try {
    const rec = await submitRemote(normalized, 'FieldCheck');
    return { status: 'synced', rec };
  } catch (err) {
    console.warn('Field check failed, queuing:', err?.message);
    await enqueueCapture(normalized, 'FieldCheck');
    return { status: 'queued' };
  }
}

export async function submitQueuedCapture(payload, entityType) {
  return submitRemote(withOperationId(payload), entityType);
}

export { MAX_RETRIES };
