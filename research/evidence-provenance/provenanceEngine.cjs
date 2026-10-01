'use strict';
// PROTOTYPE. Pure logic, zero Base44 client usage, zero schema touch —
// proves the EvidenceProvenance model (see DESIGN.md, Option C) actually
// closes the gap the Truth Table found, before anything gets implemented
// live. See README.md for how this would wire into real write paths
// (not done here, and not safe to do without explicit authorization).

const SOURCES = new Set(['ai', 'registry', 'human', 'unknown']);
const EVENT_TYPES = new Set([
  'initial_capture',
  'field_recheck',
  'human_correction',
  'moderation_decision',
]);

// Builds the provenance rows a real write path would insert alongside a
// Location/FieldCheck create or update. One row per tracked field that
// actually has a value this event is asserting something about.
function buildProvenanceRows({
  targetEntity,
  targetId,
  eventType,
  fields, // { field_name: { value, source, confidence?, modelVersion?, previousValue? } }
}) {
  if (!EVENT_TYPES.has(eventType)) {
    throw new Error(`invalid event_type: ${eventType}`);
  }
  return Object.entries(fields).map(([field_name, spec]) => {
    if (!SOURCES.has(spec.source)) {
      throw new Error(`invalid source "${spec.source}" for field ${field_name}`);
    }
    if (
      spec.source === 'ai' &&
      typeof spec.confidence !== 'number' &&
      spec.confidence !== undefined
    ) {
      throw new Error(`confidence must be a number or omitted for field ${field_name}`);
    }
    const row = {
      target_entity: targetEntity,
      target_id: targetId,
      field_name,
      value: String(spec.value),
      source: spec.source,
      event_type: eventType,
    };
    if (spec.source === 'ai' && typeof spec.confidence === 'number')
      row.confidence = spec.confidence;
    if (spec.modelVersion) row.model_version = spec.modelVersion;
    if (eventType === 'human_correction' && spec.previousValue !== undefined) {
      row.previous_value = String(spec.previousValue);
    }
    return row;
  });
}

// The actual gap this closes: PR #152's classifyChange() could not tell a
// moderator's typo fix apart from a genuine advertiser swap. This function
// takes the SAME two observations plus whatever provenance rows exist for
// the `next` observation's changed fields, and uses event_type to decide
// whether this step represents a real-world change or a data correction.
//
// Honesty constraint: if no provenance rows exist for a changed field (true
// of 100% of OOH Earth's real data today — this model has never been
// implemented live), this function says so explicitly rather than silently
// falling back to guessing either way.
const DIFF_FIELDS = ['brand_name', 'parent_corp', 'campaign_name', 'condition', 'adbust_type'];

function classifyTimelineStep(prev, next, provenanceForNext = []) {
  const changed = DIFF_FIELDS.filter((f) => prev[f] !== next[f]);
  if (changed.length === 0)
    return { change_type: 'no_change', changed_fields: [], provenance_basis: 'n/a' };

  const provenanceByField = new Map(provenanceForNext.map((r) => [r.field_name, r]));
  const withProvenance = changed.filter((f) => provenanceByField.has(f));
  const withoutProvenance = changed.filter((f) => !provenanceByField.has(f));

  if (withoutProvenance.length === changed.length) {
    // No provenance for any changed field — this is the state of ALL real
    // data today. Cannot honestly distinguish correction from real change.
    return {
      change_type: 'ambiguous_change',
      changed_fields: changed,
      provenance_basis: 'none_available',
      note: 'No EvidenceProvenance rows exist for any changed field — this observation predates the provenance model (true of all current production data). Cannot distinguish a data correction from a real-world change.',
    };
  }

  const anyHumanCorrection = withProvenance.some(
    (f) => provenanceByField.get(f).event_type === 'human_correction',
  );
  if (anyHumanCorrection) {
    return {
      change_type: 'data_corrected',
      changed_fields: changed,
      provenance_basis: 'human_correction',
      note: 'At least one changed field is provenance-tagged as a human correction, not a re-observation. Excluded from real-world change-detection claims.',
    };
  }

  // All provenanced fields agree this is a genuine re-observation.
  if (changed.includes('adbust_type')) {
    if (prev.adbust_type === 'none' && next.adbust_type !== 'none') {
      return {
        change_type: 'intervention_appeared',
        changed_fields: changed,
        provenance_basis: 'field_recheck',
      };
    }
    if (prev.adbust_type !== 'none' && next.adbust_type === 'none') {
      return {
        change_type: 'intervention_removed',
        changed_fields: changed,
        provenance_basis: 'field_recheck',
      };
    }
  }
  if (
    changed.includes('brand_name') ||
    changed.includes('parent_corp') ||
    changed.includes('campaign_name')
  ) {
    return {
      change_type: 'advertiser_replaced',
      changed_fields: changed,
      provenance_basis: 'field_recheck',
    };
  }
  return {
    change_type: 'condition_changed',
    changed_fields: changed,
    provenance_basis: 'field_recheck',
  };
}

module.exports = { buildProvenanceRows, classifyTimelineStep, SOURCES, EVENT_TYPES };
