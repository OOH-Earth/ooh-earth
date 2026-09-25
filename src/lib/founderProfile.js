// Founding Profiles — shared taxonomy + helpers.
//
// A Founding Profile is not a new entity: it's the existing self-editable
// User fields (full_name, handle, bio, avatar_url — already wired through
// Account.jsx and base44.auth.updateMe) plus a small set of additional
// freeform, owner-editable fields (region, focus_areas) using the exact
// same self-service path. `founding_member` is the one schema-declared,
// admin-only field (see User.jsonc) — it can never be set via updateMe.

export const FOCUS_AREAS = [
  'mapping',
  'field_research',
  'public_space',
  'street_sports',
  'activism',
  'media_press',
  'radio_audio',
  'xr',
  'design',
  'research',
];

export const FOCUS_AREA_LABELS = {
  mapping: 'Mapping',
  field_research: 'Field Research',
  public_space: 'Public Space',
  street_sports: 'Street Sports',
  activism: 'Activism',
  media_press: 'Media & Press',
  radio_audio: 'Radio & Audio',
  xr: 'XR',
  design: 'Design',
  research: 'Research',
};

export const focusAreaLabel = (v) => FOCUS_AREA_LABELS[v] || v;

export const MAX_BIO_LENGTH = 280;
export const MAX_REGION_LENGTH = 60;
export const MAX_FOCUS_AREAS = 5;

// A handle is the public identity/slug (e.g. oohearth.app/founders/ghostsignal).
// Kept intentionally permissive but URL-safe: letters, numbers, underscore,
// hyphen. No leading '@' (the UI strips it), no spaces or slashes.
export const HANDLE_PATTERN = /^[a-zA-Z0-9_-]{2,32}$/;

// Trims and strips a leading '@' only — it must NOT silently collapse
// internal whitespace/other characters into something that then *looks*
// valid to isValidHandle. The edit form's own onChange already prevents a
// user from typing a space in the first place; this function is also used
// to validate a value that could arrive by another path (a direct API
// call, a pasted value), so it must fail closed, not coerce-and-accept.
export function normalizeHandle(raw) {
  return String(raw || '')
    .trim()
    .replace(/^@/, '');
}

export function isValidHandle(raw) {
  return HANDLE_PATTERN.test(normalizeHandle(raw));
}

export function initialsFrom(name, handle) {
  const source = (name || handle || '').trim();
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
