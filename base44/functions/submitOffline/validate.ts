// Server-side validation for submitOffline.
//
// Derived from the Location / FieldCheck entity schemas (base44/entities) and from
// every legitimate caller (FieldReport, QuickCapture, GraffitiCamera, GraffitiCam,
// FieldCheckCamera). A test (security.test.ts) compares the enum values and field
// names below with the schema files so they cannot silently drift.
//
// Why this exists: the platform accepts any value on create (confirmed on BACKUP:
// `type: "not-a-real-type"` was stored), so nothing else stops malformed or
// unbounded input reaching the database.
//
// Policy:
//  - Structural fields (title, finite in-range lat/lng, location_id) and `type` /
//    `location_type`: wrong value -> permanent validation error.
//  - Other optional enums (sector, condition, adbust type, ...): an out-of-vocabulary
//    value is DROPPED (never stored; the schema default / null applies) and reported,
//    because some of these are filled by an AI scan and a model quirk must not cost
//    a person their contribution. '' and null mean "not provided".
//  - Unknown fields are dropped and reported. Server-owned/privileged fields (status,
//    status_updated_at, id, created_by_id, timestamps) are not in any allowlist.
//  - Errors name fields and reasons only; they never echo submitted values.

export type Issue = { field: string; reason: string };
export type ValidationResult =
  | { ok: true; payload: Record<string, unknown>; ignored: string[]; normalized: string[] }
  | { ok: false; issues: Issue[] };

export const TYPE_ENUM = [
  'billboard',
  'painted',
  'digital',
  'projection',
  'sticker',
  'mural',
  'transit',
  'skatepark',
  'basketball_court',
  'multi_use_court',
  'other',
];
export const SETTING_ENUM = ['unknown', 'outdoor', 'indoor', 'covered'];
export const PUBLIC_ACCESS_ENUM = ['unknown', 'free', 'low_cost', 'restricted'];
export const ACCESS_KEY_ENUM = [
  'none',
  '4-way-utility',
  'cemusapin',
  'circle',
  'circle-set',
  'circle-wall',
  'h60',
  'jcd-superlock',
  'large-square',
  'small-square',
  't-handle',
  'tx30',
  'tri38',
  'unknown',
];
export const INDUSTRY_SECTOR_ENUM = [
  'fossil_fuel',
  'tobacco',
  'alcohol',
  'gambling',
  'ultra_processed_food',
  'surveillance',
  'finance',
  'real_estate',
  'fashion',
  'automotive',
  'pharma',
  'other',
];
export const CONDITION_ENUM = [
  'functional',
  'neglected',
  'damaged',
  'abandoned',
  'reclaimed',
  'upgraded',
];
export const ADBUST_TYPE_ENUM = [
  'none',
  'subverted',
  'painted_over',
  'stickered',
  'projected',
  'wheatpasted',
  'removed',
  'other',
];
export const GRAFFITI_MEDIUM_ENUM = [
  'spray_paint',
  'marker',
  'sticker',
  'paste_up',
  'stencil',
  'installation',
  'other',
];
export const GRAFFITI_STYLE_ENUM = [
  'tag',
  'throw_up',
  'piece',
  'mural',
  'blockbuster',
  'stencil',
  'paste_up',
  'other',
];

type Rule =
  | { kind: 'string'; max: number; required?: boolean; pattern?: RegExp }
  | { kind: 'url'; max: number }
  | { kind: 'number'; min: number; max: number; required?: boolean }
  | { kind: 'enum'; values: string[]; strict: boolean }
  | { kind: 'strings'; maxItems: number; maxLen: number };

const url = (): Rule => ({ kind: 'url', max: 2048 });
const text = (max: number): Rule => ({ kind: 'string', max });
const soft = (values: string[]): Rule => ({ kind: 'enum', values, strict: false });

export const LOCATION_RULES: Record<string, Rule> = {
  client_operation_id: { kind: 'string', max: 120 },
  title: { kind: 'string', max: 200, required: true },
  type: { kind: 'enum', values: TYPE_ENUM, strict: true },
  setting: soft(SETTING_ENUM),
  public_access: soft(PUBLIC_ACCESS_ENUM),
  address: text(500),
  lat: { kind: 'number', min: -90, max: 90, required: true },
  lng: { kind: 'number', min: -180, max: 180, required: true },
  image_url: url(),
  source_link: url(),
  notes: text(10000),
  access_key: soft(ACCESS_KEY_ENUM),
  brand_name: text(200),
  ooh_operator: text(200),
  ad_agency: text(200),
  campaign_name: text(200),
  parent_corp: text(200),
  industry_sector: soft(INDUSTRY_SECTOR_ENUM),
  harm_tags: { kind: 'strings', maxItems: 30, maxLen: 80 },
  condition: soft(CONDITION_ENUM),
  adbust_type: soft(ADBUST_TYPE_ENUM),
  adbust_image_url: url(),
  graffiti_medium: soft(GRAFFITI_MEDIUM_ENUM),
  graffiti_style: soft(GRAFFITI_STYLE_ENUM),
  graffiti_surface_m2: { kind: 'number', min: 0, max: 10_000_000 },
  graffiti_coverage_pct: { kind: 'number', min: 0, max: 100 },
  harm_statement: text(2000),
  action_flags: { kind: 'strings', maxItems: 30, maxLen: 80 },
};

export const FIELD_CHECK_RULES: Record<string, Rule> = {
  client_operation_id: { kind: 'string', max: 120 },
  location_id: { kind: 'string', max: 64, required: true, pattern: /^[A-Za-z0-9_-]+$/ },
  location_title: text(200),
  location_type: { kind: 'enum', values: TYPE_ENUM, strict: true },
  image_url: url(),
  lat: { kind: 'number', min: -90, max: 90, required: true },
  lng: { kind: 'number', min: -180, max: 180, required: true },
  address: text(500),
  condition: soft(CONDITION_ENUM),
  access_key: soft(ACCESS_KEY_ENUM),
  brand_name: text(200),
  adbust_type: soft(ADBUST_TYPE_ENUM),
  notes: text(10000),
  checked_by: text(200),
};

const RULES: Record<string, Record<string, Rule>> = {
  Location: LOCATION_RULES,
  FieldCheck: FIELD_CHECK_RULES,
};

const isHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

export function validateSubmission(
  entity: string,
  input: Record<string, unknown>,
): ValidationResult {
  const rules = RULES[entity];
  if (!rules) return { ok: false, issues: [{ field: 'entity_type', reason: 'unsupported' }] };

  const issues: Issue[] = [];
  const payload: Record<string, unknown> = {};
  const ignored: string[] = [];
  const normalized: string[] = [];

  for (const key of Object.keys(input)) {
    if (!(key in rules)) ignored.push(key);
  }

  for (const [field, rule] of Object.entries(rules)) {
    const raw = input[field];
    const provided = raw !== undefined && raw !== null;
    const required = 'required' in rule && rule.required === true;

    if (!provided) {
      if (required) issues.push({ field, reason: 'required' });
      continue;
    }

    switch (rule.kind) {
      case 'string': {
        if (typeof raw !== 'string') {
          issues.push({ field, reason: 'must_be_text' });
        } else if (raw.length > rule.max) {
          issues.push({ field, reason: 'too_long' });
        } else if (required && raw.trim().length === 0) {
          issues.push({ field, reason: 'required' });
        } else if (rule.pattern && !rule.pattern.test(raw)) {
          issues.push({ field, reason: 'invalid_format' });
        } else {
          payload[field] = raw;
        }
        break;
      }
      case 'url': {
        if (typeof raw !== 'string') {
          issues.push({ field, reason: 'must_be_text' });
        } else if (raw === '') {
          payload[field] = raw; // "no link" is a legitimate stored value
        } else if (raw.length > rule.max) {
          issues.push({ field, reason: 'too_long' });
        } else if (!isHttpUrl(raw)) {
          issues.push({ field, reason: 'invalid_url' });
        } else {
          payload[field] = raw;
        }
        break;
      }
      case 'number': {
        if (typeof raw !== 'number' || !Number.isFinite(raw)) {
          issues.push({ field, reason: 'must_be_a_finite_number' });
        } else if (raw < rule.min || raw > rule.max) {
          issues.push({ field, reason: 'out_of_range' });
        } else {
          payload[field] = raw;
        }
        break;
      }
      case 'enum': {
        if (raw === '') break; // "not provided"; the schema default applies
        if (typeof raw !== 'string') {
          issues.push({ field, reason: 'must_be_text' });
        } else if (rule.values.includes(raw)) {
          payload[field] = raw;
        } else if (rule.strict) {
          issues.push({ field, reason: 'not_allowed' });
        } else {
          normalized.push(field); // dropped, never stored
        }
        break;
      }
      case 'strings': {
        if (!Array.isArray(raw)) {
          issues.push({ field, reason: 'must_be_a_list' });
        } else if (raw.length > rule.maxItems) {
          issues.push({ field, reason: 'too_many_items' });
        } else if (raw.some((item) => typeof item !== 'string' || item.length > rule.maxLen)) {
          issues.push({ field, reason: 'invalid_item' });
        } else {
          payload[field] = raw;
        }
        break;
      }
    }
  }

  if (issues.length) return { ok: false, issues };
  return { ok: true, payload, ignored, normalized };
}
