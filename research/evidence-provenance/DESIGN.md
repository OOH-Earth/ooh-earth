# Provenance Model Design

## The question this model must answer

**"Why does this stored field have this value?"** — with as little extra
data as possible. Not "let's log everything."

## Four options considered

### A. Flat additive fields on `Location`/`FieldCheck`
e.g. `brand_name_source`, `brand_name_confidence`, `industry_sector_source`, …
— one pair per tracked field (≈7 tracked fields → 14 new top-level
properties, roughly doubling each entity's schema surface).

### B. Compact provenance JSON on one new field
e.g. `provenance: '{"brand_name":{"source":"ai","confidence":0.82},...}'`
stored as a single JSON string (the same pattern `IntelCache.payload`
already uses in this codebase for opaque blobs).

### C. Separate `EvidenceProvenance` entity
One new entity, one row per (target record, field, event) — e.g.
`{target_entity, target_id, field_name, source, confidence, model_version,
previous_value, actor_role, event_type, created_date}`. `Location` and
`FieldCheck` are completely untouched.

### D. Generic event/history model
A full event-sourcing ledger for every entity mutation in the app
(`{entity, entity_id, field, old_value, new_value, actor, timestamp}`),
from which current state is one possible projection.

## Scoring (1–10, higher = better)

| | A. Flat fields | B. Compact JSON | C. Separate entity | D. Event ledger |
|---|---|---|---|---|
| Queryability | 9 | 3 | 8 | 7 |
| Auditability | 3 | 4 | 9 | 10 |
| Migration complexity (lower=easier, shown inverted: 10=easiest) | 9 | 9 | 7 | 3 |
| Base44 compatibility | 10 | 6 | 9 | 5 |
| Storage cost (10=cheapest) | 9 | 8 | 6 | 4 |
| Future linkage usefulness | 5 | 4 | 9 | 10 |
| Backward compatibility | 9 | 9 | **10** | 6 |

**Why C wins, not just "highest total":**

- **A and B both fail the auditability requirement in the same way**: they
  describe the *current* value's provenance but get silently overwritten
  by the very next `Location.update()` — exactly the failure mode the
  Truth Table's "second finding" identifies. Neither actually fixes the
  human-correction-vs-real-change ambiguity, which is the concrete defect
  this recon surfaced in `buildTimeline()`.
- **B trades away queryability for a small storage win that doesn't
  matter at OOH Earth's scale** — Base44's filter semantics (observed
  throughout this codebase: `entities.X.filter({field: value})`) work on
  flat properties, not on parsing a JSON string per row. B is strictly
  worse than A on the axis that actually matters (you can't ask "show me
  every low-confidence AI brand_name pending review" without pulling every
  row and parsing client-side), while being no better on auditability.
  B is dominated — never the right choice.
- **D is the "correct" answer at real institutional scale** but violates
  the explicit instruction to resist schema bloat and find the *smallest*
  additive model. It requires rewriting every existing write path
  (`FieldReport.jsx`, `FieldCheckCamera.jsx`, `LocationEditPanel.jsx`,
  `ArLens.jsx`) to emit a second, ideally-atomic write, with no obvious
  Base44 primitive for cross-entity transactions in the client SDK — real
  build cost and real risk for a capability nothing currently needs. This
  is a LATER-tier upgrade, not now.
- **C achieves auditability without touching `Location`/`FieldCheck` at
  all.** Because each provenance row is only ever **inserted, never
  updated**, a human correction naturally becomes a *new* row with
  `event_type: 'human_correction'` sitting right next to the original
  `event_type: 'initial_capture'` row — the exact distinction
  `buildTimeline()` is currently missing, achieved for free by the shape
  of the model rather than by extra logic. And **there is already a
  precedent for exactly this pattern in the live schema**: `AccessLog` is
  already a separate append-style entity recording events about other
  records, not a field bolted onto them. C isn't a novel pattern being
  introduced — it's reusing one that already exists.

**Chosen: C — a separate `EvidenceProvenance` entity.**

## Proposed shape (design only — not implemented, see Mission 3/6)

```jsonc
{
  "name": "EvidenceProvenance",
  "type": "object",
  "properties": {
    "target_entity": { "type": "string", "enum": ["Location", "FieldCheck"] },
    "target_id": { "type": "string" },
    "field_name": { "type": "string" },
    "value": { "type": "string" }, // stringified — provenance rows are metadata, not typed storage
    "source": { "type": "string", "enum": ["ai", "registry", "human", "unknown"] },
    "confidence": { "type": "number" }, // present only when source == "ai" and the model actually returned one
    "model_version": { "type": "string" }, // e.g. "claude_sonnet_4_6" — omitted for non-AI sources
    "event_type": {
      "type": "string",
      "enum": ["initial_capture", "field_recheck", "human_correction", "moderation_decision"]
    },
    "previous_value": { "type": "string" } // only set on human_correction — lets a UI show "changed from X"
  },
  "required": ["target_entity", "target_id", "field_name", "value", "source", "event_type"],
  "rls": {
    "create": null,
    "read": { "$or": [{ "user_condition": { "role": "admin" } }, { "created_by_id": "{{user.id}}" }] },
    "update": null, // append-only by design — this is the entire point
    "delete": { "user_condition": { "role": "admin" } }
  }
}
```

`update: null` is deliberate — the model's integrity depends on rows never
being edited. This mirrors the real `AccessLog` entity's role in this
codebase (an append-style record of events, not a mutable field).

## Mission 3 — collision / ownership check

Full live implementation would touch:

| File | Change needed | Owned by another lane? |
|---|---|---|
| `base44/entities/EvidenceProvenance.jsonc` (new) | new entity schema | No — new file, not on any ownership list |
| `src/components/ooh/FieldReport.jsx` | write a provenance row per tracked field alongside `submitCapture()` | No — not observability, not revenue |
| `src/components/ooh/FieldCheckCamera.jsx` | same, alongside `submitFieldCheck()` | No |
| `src/components/ooh/report/ReportScanner.jsx` | surface `sectorConflict`/confidence into the payload passed up, instead of dropping it | No |
| `src/components/ooh/LocationEditPanel.jsx` | write `event_type: 'human_correction'` rows with `previous_value` on `save()`/`quickAction()` | No |

**Zero overlap** with the observability-lane ownership list (`telemetry.ts`,
`fieldStats/handler.ts`, `runtimeHealth/*`, `stripeWebhook/handler.ts`,
`submitOffline/handler.ts`, `tests/security.test.ts`,
`PRODUCTION_OBSERVABILITY_RUNBOOK.md`, `TECHNOLOGY_ARCHITECTURE_2.md`,
`server-function-security-check.mjs`) or any revenue-lane file. **No
collision.**

**But** this is still a live production schema addition + four live
component edits — outside "new files + local fixtures" even though no
other session owns these files. Per this mission's explicit constraint
(*"If schema change is required for a meaningful implementation, stop at
design unless explicitly authorized"*), **implementation stops here.**
`base44/entities/EvidenceProvenance.jsonc` was never created in the real
repo; none of the four listed files were touched. What follows
(`provenance.cjs`) is a pure-logic, zero-schema-touch prototype proving the
model's behavior in isolation — the same discipline PR #152 already
followed.
