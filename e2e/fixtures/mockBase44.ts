import type { Page, Route } from '@playwright/test';

// This sandbox has no live Base44 backend (VITE_BASE44_APP_BASE_URL is
// intentionally unset — see CLAUDE.md rule #4 and e2e/smoke.spec.ts). The
// SDK (@base44/sdk) is a thin axios wrapper over a predictable REST shape:
//   GET    /api/apps/:appId/entities/:Entity           (list / filter, ?q=<json query>)
//   GET    /api/apps/:appId/entities/:Entity/:id        (get)
//   POST   /api/apps/:appId/entities/:Entity            (create)
//   PUT    /api/apps/:appId/entities/:Entity/:id         (update)
//   GET    /api/apps/:appId/entities/User/me            (auth.me)
//   POST   /api/apps/:appId/integration-endpoints/Core/UploadFile
// (see node_modules/@base44/sdk/dist/modules/entities.js, auth.js,
// integrations.js). The response interceptor unwraps to response.data, so
// fulfilling with a raw JSON array/object is exactly what entity callers
// receive — no envelope.
//
// This mocks that REST surface at the network layer only — it does not
// change any application code — so the pages under test run their real
// fetch/create/update logic against fixture data instead of a live backend.

export type MockDb = {
  user?: Record<string, unknown> | null;
  locations?: Record<string, any>;
  locationPhotos?: any[];
  storeItems?: Record<string, any>;
  fieldChecks?: Record<string, any>;
  uploadUrl?: string;
};

function matchesQuery(rec: Record<string, any>, query: Record<string, any>) {
  if ('$or' in query) return query.$or.some((part: Record<string, any>) => matchesQuery(rec, part));
  return Object.entries(query).every(([k, v]) => {
    if (k === '$or') return true;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.entries(v).every(([operator, expected]) => {
        if (operator === '$gte') return rec[k] >= expected;
        if (operator === '$lte') return rec[k] <= expected;
        if (operator === '$gt') return rec[k] > expected;
        if (operator === '$lt') return rec[k] < expected;
        if (operator === '$in') return expected.includes(rec[k]);
        if (operator === '$ne') return rec[k] !== expected;
        return false;
      });
    }
    return Array.isArray(v) ? v.includes(rec[k]) : rec[k] === v;
  });
}

export async function mockBase44(page: Page, db: MockDb) {
  let photoSeq = (db.locationPhotos ?? []).length;

  await page.route('**/api/apps/**', async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    const marker = '/entities/';
    const entityIdx = url.pathname.indexOf(marker);

    if (url.pathname.includes('/integration-endpoints/Core/UploadFile')) {
      return route.fulfill({
        json: { file_url: db.uploadUrl ?? 'https://example.com/mock-upload.jpg' },
      });
    }

    if (url.pathname.includes('/functions/submitOffline')) {
      const body = req.postDataJSON() ?? {};
      const entityType = body.entity_type;
      const payload = body.payload ?? {};
      if (entityType === 'Location') {
        const store = db.locations ?? (db.locations = {});
        const existing = Object.values(store).find(
          (record: any) => record.client_operation_id === payload.client_operation_id,
        );
        if (existing)
          return route.fulfill({ json: { ok: true, duplicate: true, record: existing } });
        const id = payload.id ?? `mock-location-${Object.keys(store).length + 1}`;
        const record = {
          id,
          status: 'pending',
          created_by_id: db.user?.id,
          ...payload,
        };
        store[id] = record;
        return route.fulfill({ json: { ok: true, duplicate: false, record } });
      }
      if (entityType === 'FieldCheck') {
        const store = db.fieldChecks ?? (db.fieldChecks = {});
        const existing = Object.values(store).find(
          (record: any) => record.client_operation_id === payload.client_operation_id,
        );
        if (existing)
          return route.fulfill({ json: { ok: true, duplicate: true, record: existing } });
        const id = payload.id ?? `mock-field-check-${Object.keys(store).length + 1}`;
        const record = {
          id,
          status: 'pending',
          created_by_id: db.user?.id,
          created_date: new Date().toISOString(),
          ...payload,
        };
        store[id] = record;
        return route.fulfill({ json: { ok: true, duplicate: false, record } });
      }
      return route.fulfill({ status: 400, json: { error: 'Invalid submission' } });
    }

    // base44.functions.invoke('moderate', body) -> POST /functions/moderate.
    // Dashboard.jsx now routes ALL verify/reject (and even the pending-queue
    // read, for every clearance level) through this function — there's no
    // more direct-entity-update path for admins. Mirrors
    // base44/functions/moderate/entry.ts's actual logic (status_updated_at +
    // LocationPhoto cascade) so the mock and the real function can't drift
    // apart silently.
    if (url.pathname.includes('/functions/moderate')) {
      const body = req.postDataJSON() ?? {};
      const store = db.locations ?? (db.locations = {});
      const photos = db.locationPhotos ?? (db.locationPhotos = []);
      const checks = db.fieldChecks ?? (db.fieldChecks = {});
      if (body.action === 'queue') {
        const locations = Object.values(store).filter((l: any) => l.status === 'pending');
        const field_checks = Object.values(checks).filter((c: any) => c.status === 'pending');
        return route.fulfill({ json: { ok: true, locations, digital_busts: [], field_checks } });
      }
      if (body.action === 'verify') {
        const { entity = 'Location', id, status } = body;
        const status_updated_at = new Date().toISOString();
        if (entity === 'Location' && store[id]) {
          Object.assign(store[id], { status, status_updated_at });
          for (const p of photos) {
            if (p.location_id === String(id) && p.status === 'pending') p.status = status;
          }
        }
        if (entity === 'FieldCheck' && checks[id]) {
          Object.assign(checks[id], { status, status_updated_at });
        }
        return route.fulfill({
          json: { ok: true, action: 'verify', changed: { entity, id, status } },
        });
      }
      return route.fulfill({ json: { ok: true } });
    }

    if (entityIdx === -1) {
      // Non-entity boot-time calls this app fires on every page (analytics
      // batching, public-settings, LLM integrations) — irrelevant to the
      // feature under test, so answer benignly rather than 404 so they don't
      // masquerade as a real network failure in the assertions below.
      if (method === 'GET') return route.fulfill({ json: {} });
      return route.fulfill({ json: { ok: true } });
    }

    const rest = url.pathname.slice(entityIdx + marker.length).split('/');
    const entity = rest[0];
    const idOrAction = rest[1];

    if (entity === 'User' && idOrAction === 'me' && method === 'GET') {
      if (!db.user) return route.fulfill({ status: 401, json: { message: 'Not authenticated' } });
      return route.fulfill({ json: db.user });
    }

    if (entity === 'Location') {
      const store = db.locations ?? (db.locations = {});
      if (idOrAction && method === 'GET') {
        const rec = store[idOrAction];
        if (!rec) return route.fulfill({ status: 404, json: { message: 'Not found' } });
        return route.fulfill({ json: rec });
      }
      if (idOrAction && method === 'PUT') {
        const body = req.postDataJSON();
        store[idOrAction] = { ...(store[idOrAction] ?? { id: idOrAction }), ...body };
        return route.fulfill({ json: store[idOrAction] });
      }
      if (!idOrAction && method === 'GET') {
        const q = url.searchParams.get('q');
        let list = Object.values(store);
        if (q) list = list.filter((rec) => matchesQuery(rec, JSON.parse(q)));
        return route.fulfill({ json: list });
      }
      if (!idOrAction && method === 'POST') {
        const body = req.postDataJSON();
        const id = body.id ?? `mock-location-${Object.keys(store).length + 1}`;
        // Real Base44 stamps created_by_id server-side from the auth
        // context; the client payload never includes it. Mirror that here
        // (defaulted, not overriding an explicit body value) so a report
        // filed during a test attributes correctly to the mocked user's own
        // gamification stats -- same as it would against the real backend.
        store[id] = { id, status: 'pending', created_by_id: db.user?.id, ...body };
        return route.fulfill({ json: store[id] });
      }
    }

    if (entity === 'FieldCheck') {
      const store = db.fieldChecks ?? (db.fieldChecks = {});
      if (idOrAction && method === 'GET') {
        const rec = store[idOrAction];
        if (!rec) return route.fulfill({ status: 404, json: { message: 'Not found' } });
        return route.fulfill({ json: rec });
      }
      if (idOrAction && method === 'PUT') {
        const body = req.postDataJSON();
        store[idOrAction] = { ...(store[idOrAction] ?? { id: idOrAction }), ...body };
        return route.fulfill({ json: store[idOrAction] });
      }
      if (!idOrAction && method === 'GET') {
        const q = url.searchParams.get('q');
        let list = Object.values(store);
        if (q) list = list.filter((rec) => matchesQuery(rec, JSON.parse(q)));
        list = [...list].sort(
          (a: any, b: any) =>
            new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime(),
        );
        return route.fulfill({ json: list });
      }
      if (!idOrAction && method === 'POST') {
        const body = req.postDataJSON();
        const id = body.id ?? `mock-field-check-${Object.keys(store).length + 1}`;
        store[id] = {
          id,
          status: 'pending',
          created_by_id: db.user?.id,
          created_date: new Date().toISOString(),
          ...body,
        };
        return route.fulfill({ json: store[id] });
      }
    }

    if (entity === 'LocationPhoto') {
      const list = db.locationPhotos ?? (db.locationPhotos = []);
      if (idOrAction && method === 'PUT') {
        const body = req.postDataJSON();
        const rec = list.find((p) => String(p.id) === idOrAction);
        if (rec) Object.assign(rec, body);
        return route.fulfill({ json: rec ?? { id: idOrAction, ...body } });
      }
      if (!idOrAction && method === 'GET') {
        const q = url.searchParams.get('q');
        let rows = list;
        if (q) rows = rows.filter((rec) => matchesQuery(rec, JSON.parse(q)));
        rows = [...rows].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
        return route.fulfill({ json: rows });
      }
      if (!idOrAction && method === 'POST') {
        const body = req.postDataJSON();
        photoSeq += 1;
        const rec = { id: `mock-photo-${photoSeq}`, status: 'pending', ...body };
        list.push(rec);
        return route.fulfill({ json: rec });
      }
    }

    if (entity === 'StoreItem') {
      const store = db.storeItems ?? (db.storeItems = {});
      if (idOrAction && method === 'PUT') {
        const body = req.postDataJSON();
        store[idOrAction] = { ...(store[idOrAction] ?? { id: idOrAction }), ...body };
        return route.fulfill({ json: store[idOrAction] });
      }
      if (idOrAction && method === 'DELETE') {
        delete store[idOrAction];
        return route.fulfill({ json: { ok: true } });
      }
      if (!idOrAction && method === 'GET') {
        return route.fulfill({ json: Object.values(store) });
      }
      if (!idOrAction && method === 'POST') {
        const body = req.postDataJSON();
        const id = body.id ?? `mock-store-item-${Object.keys(store).length + 1}`;
        store[id] = { id, ...body };
        return route.fulfill({ json: store[id] });
      }
    }

    // Everything else this app boot-fetches on every page (public-settings,
    // other entities like Mint/DigitalBust, analytics, etc.) — benign empty
    // 200s so unrelated widgets don't hang, throw, or log a false-positive
    // "App state check failed" that has nothing to do with the feature under
    // test. GET-shaped calls get an empty list, everything else an empty object.
    if (method === 'GET') return route.fulfill({ json: [] });
    return route.fulfill({ json: {} });
  });
}

// Crash-signal filter, matching e2e/smoke.spec.ts: this sandbox has no live
// Base44 backend, so Base44Error / failed-resource console entries for
// anything NOT explicitly mocked above are expected offline artifacts, not
// regressions. Only fail tests on signals that mean the React tree crashed.
const CRASH_SIGNALS = [/Uncaught/i, /ReferenceError/i, /is not a function/i, /is not defined/i];
export function filterCrashes(consoleErrors: string[]) {
  return consoleErrors.filter((e) => CRASH_SIGNALS.some((re) => re.test(e)));
}

export const ADMIN_USER = {
  id: 'admin-1',
  email: 'admin@oohearth.test',
  role: 'admin',
  access: 'admin',
};
