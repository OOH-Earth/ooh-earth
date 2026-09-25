// Public Space / Street Sports Intelligence — shared taxonomy.
//
// A public recreation facility (skatepark, basketball court, ...) is just a
// Location whose `type` is one of PUBLIC_SPACE_TYPES — it reuses the same
// record, the same moderation queue, the same map. This module is the single
// source of truth for that type list plus the two optional facility metadata
// enums (`setting`, `public_access`) and the relationship taxonomy, so no
// file has to redeclare them.
//
// "NO EVIDENCE, NO CLAIM": a relationship_type of anything other than
// 'unknown' must never be set from a bare visual observation (a logo) alone
// — it requires an evidence_source and moderator verification. See
// LocationRelationship.jsonc's `status` RLS lock.

export const PUBLIC_SPACE_TYPES = ['skatepark', 'basketball_court', 'multi_use_court'];

export const isPublicSpaceType = (type) => PUBLIC_SPACE_TYPES.includes(type);

export const PUBLIC_SPACE_TYPE_LABELS = {
  skatepark: 'Skatepark',
  basketball_court: 'Basketball Court',
  multi_use_court: 'Multi-Use Court',
};

export const SETTING_OPTIONS = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'covered', label: 'Covered' },
];

export const PUBLIC_ACCESS_OPTIONS = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'free', label: 'Free' },
  { value: 'low_cost', label: 'Low cost' },
  { value: 'restricted', label: 'Restricted' },
];

export const settingLabel = (v) => SETTING_OPTIONS.find((o) => o.value === v)?.label || 'Unknown';
export const publicAccessLabel = (v) =>
  PUBLIC_ACCESS_OPTIONS.find((o) => o.value === v)?.label || 'Unknown';

// Relationship types a piece of evidence can eventually support. 'unknown'
// is the only safe default for anything not yet backed by an evidence_source
// and a moderator verification — a visible logo alone stays 'unknown'.
export const RELATIONSHIP_TYPES = [
  'unknown',
  'sponsor',
  'funder',
  'operator',
  'owner',
  'delivery_partner',
  'naming_rights',
  'community_partner',
];

export const RELATIONSHIP_TYPE_LABELS = {
  unknown: 'Unknown',
  sponsor: 'Sponsor',
  funder: 'Funder',
  operator: 'Operator',
  owner: 'Owner',
  delivery_partner: 'Delivery Partner',
  naming_rights: 'Naming Rights',
  community_partner: 'Community Partner',
};

export const relationshipTypeLabel = (v) => RELATIONSHIP_TYPE_LABELS[v] || 'Unknown';
