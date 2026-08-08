import { base44 } from "@/api/base44Client";

const DB_NAME = "ooh_offline";
const STORE = "captures";
const MAX_RETRIES = 5;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
      // v2: add retries field to existing records via version migration
      if (req.result.version >= 2 && !db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function notify() {
  window.dispatchEvent(new CustomEvent("ooh-queue-changed"));
}

export async function enqueueCapture(payload, entityType = "Location") {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).add({ payload, entityType, created: Date.now(), retries: 0 });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  notify();
}

export async function listCaptures() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removeCapture(id) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  notify();
}

export async function incrementRetries(id) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
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
  if (!navigator.onLine) {
    await enqueueCapture(payload, "Location");
    return { status: "queued" };
  }
  try {
    const rec = await base44.entities.Location.create(payload);
    return { status: "synced", rec };
  } catch (err) {
    console.warn("Capture failed, queuing:", err?.message);
    await enqueueCapture(payload, "Location");
    return { status: "queued" };
  }
}

export async function submitFieldCheck(payload) {
  if (!navigator.onLine) {
    await enqueueCapture(payload, "FieldCheck");
    return { status: "queued" };
  }
  try {
    const rec = await base44.entities.FieldCheck.create(payload);
    return { status: "synced", rec };
  } catch (err) {
    console.warn("Field check failed, queuing:", err?.message);
    await enqueueCapture(payload, "FieldCheck");
    return { status: "queued" };
  }
}

export { MAX_RETRIES };