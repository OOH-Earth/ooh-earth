import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// A tiny, generic evaluator for the RLS shapes actually used in
// base44/entities/*.jsonc ($or, data.<field> equality, created_by_id:
// "{{user.id}}" templating, user_condition on role/data.<field>). This is
// the ONE place that understands what an RLS rule means -- e2e/fixtures/
// mockBase44.ts imports it to filter entity reads, and
// e2e/contracts/entityRls.spec.ts imports it to assert a golden matrix
// against the *actual* parsed .jsonc rule, not a hand-copied description of
// it.
//
// Why this exists: the Ad Scanner multi-photo regression against production
// location 6aabfdc021a942360f9b7e4a (2026-09-17) happened because
// mockBase44.ts's LocationPhoto reads had no RLS concept at all -- every
// mocked viewer saw every row regardless of status or created_by_id. A
// client-side bug (PhotoGallery.jsx re-filtering to status==='verified')
// went undetected because the mock could never disagree with a client-side
// filter that merely duplicated what should have been the backend's job.
// Deriving the mock's visibility rules from the *same file* Base44 itself
// reads means a future change to an entity's RLS block is automatically
// picked up here too -- there is no second copy to fall out of sync.

export type Viewer = { id?: string; role?: string; access?: string } | null | undefined;
export type RlsRule = Record<string, unknown> | null;

function stripJsonComments(text: string): string {
  // base44/entities/*.jsonc only ever uses whole-line // comments (see any
  // file in that directory) -- matches the parsing already relied on
  // elsewhere in this repo's own tooling for the same files.
  return text.replace(/^\s*\/\/.*$/gm, '');
}

const entityCache = new Map<string, Record<string, unknown>>();

export function loadEntity(name: string): Record<string, unknown> {
  const cached = entityCache.get(name);
  if (cached) return cached;
  const path = resolve(process.cwd(), 'base44', 'entities', `${name}.jsonc`);
  const parsed = JSON.parse(stripJsonComments(readFileSync(path, 'utf8')));
  entityCache.set(name, parsed);
  return parsed;
}

export function loadReadRls(entityName: string): RlsRule {
  const entity = loadEntity(entityName) as { rls?: { read?: RlsRule } };
  return entity.rls?.read ?? null;
}

function isAdmin(viewer: Viewer): boolean {
  return !!viewer && viewer.role === 'admin';
}

/**
 * Evaluates one RLS `read` rule against a record and a viewer. Supports the
 * exact shapes present in this repo's entity schemas today: $or, $and,
 * `data.<field>: <value>` / bare `<field>: <value>` equality on the record,
 * `created_by_id: "{{user.id}}"` (or a literal id) matched against the
 * viewer, and `user_condition: { role: "admin" }` / `{ "data.access":
 * "admin" }` matched against the viewer's own attributes. A null rule means
 * unrestricted (matches Base44's own semantics for an absent RLS block).
 */
export function evaluateRlsRead(
  rule: RlsRule,
  record: Record<string, unknown>,
  viewer: Viewer,
): boolean {
  if (rule == null) return true;
  if ('$or' in rule) {
    const branches = rule.$or as RlsRule[];
    return branches.some((sub) => evaluateRlsRead(sub, record, viewer));
  }
  if ('$and' in rule) {
    const branches = rule.$and as RlsRule[];
    return branches.every((sub) => evaluateRlsRead(sub, record, viewer));
  }
  return Object.entries(rule).every(([key, expected]) => {
    if (key === 'user_condition') {
      if (!viewer) return false;
      return Object.entries(expected as Record<string, unknown>).every(
        ([viewerKey, viewerExpected]) => {
          if (viewerKey === 'role') return viewer.role === viewerExpected;
          const field = viewerKey.startsWith('data.') ? viewerKey.slice('data.'.length) : viewerKey;
          return (viewer as Record<string, unknown>)[field] === viewerExpected;
        },
      );
    }
    if (key === 'created_by_id') {
      if (!viewer?.id) return false;
      const expectedValue = expected === '{{user.id}}' ? viewer.id : expected;
      return record?.created_by_id === expectedValue;
    }
    const field = key.startsWith('data.') ? key.slice('data.'.length) : key;
    return record?.[field] === expected;
  });
}

export function canReadEntity(
  entityName: string,
  record: Record<string, unknown>,
  viewer: Viewer,
): boolean {
  return evaluateRlsRead(loadReadRls(entityName), record, viewer);
}

export function canReadAsAdmin(viewer: Viewer): boolean {
  return isAdmin(viewer);
}
