# Evidence Provenance — R&D Prototype

Status: **DESIGN + isolated logic prototype only.** No live schema was
created, no existing file was modified, nothing was deployed. This is the
follow-up to PR #152 (Evidence Linkage Engine), scoped to a narrower
question: **can OOH Earth make future intelligence auditable before
building more on top of it?**

## Read this in order

1. **`TRUTH_TABLE.md`** — Mission 1. Exact, code-cited field-level trace of
   where every tracked field's value comes from today, and precisely what
   provenance is computed-then-discarded at each step. Includes the
   sharpest finding: `ReportScanner.jsx` already computes a model-vs-registry
   conflict signal (`sectorConflict`) that is shown to the operative and
   then never transmitted anywhere.
2. **`DESIGN.md`** — Mission 2 + 3. Four provenance-model options scored
   honestly (flat fields / compact JSON / separate entity / event ledger),
   why a separate append-only `EvidenceProvenance` entity wins without
   requiring any change to `Location`/`FieldCheck`, and the file-level
   collision check against the observability lane's ownership boundaries
   (zero overlap — but implementation still stops at design, see below).
3. **`provenanceEngine.cjs` + `.test.cjs`** — Mission 6. The one thing
   actually built: pure-logic proof that this model closes a **real
   defect surfaced during this recon**, not a hypothetical one — PR #152's
   `classifyChange()` cannot tell a moderator's typo fix apart from a
   genuine advertiser swap. Run it: `node provenanceEngine.test.cjs`
   (zero dependencies, ~50ms, exits 0). Four scenarios, including the
   honest one: with **zero** provenance rows (the actual state of all
   production data today), the classifier reports `ambiguous_change`
   rather than guessing — this model helps future observations, not
   retroactively.
4. **`benchmark-design/REAL_PHOTO_BENCHMARK.md`** — Mission 4 + 5. Confirms
   (searched, not assumed) that **zero real photographs exist anywhere in
   this repository** — the only image fixtures are 1×1 pixel test stubs.
   No images were fabricated to fill that gap. Delivers the label schema
   and harness design only, plus production-relevant thresholds defined
   *before* any real data exists (false-link rate ≤ 2% gates any
   user-visible surfacing — recall is explicitly secondary, per this
   mission's "would rather miss a candidate than wrongly assert a
   relationship").
5. **`proposed-entity-schema.jsonc`** — the actual schema this design
   proposes, kept out of `base44/entities/` on purpose (see below).

## Why implementation stopped at design, not code

A meaningful live version of this needs a new entity
(`base44/entities/EvidenceProvenance.jsonc`) and edits to four live
components (`FieldReport.jsx`, `FieldCheckCamera.jsx`, `ReportScanner.jsx`,
`LocationEditPanel.jsx`). None of those collide with the observability or
revenue lanes — but a new production schema and four live component edits
is a real product decision, not something to make unilaterally from an R&D
brief. This mission's own instruction is explicit: *"If schema change is
required for a meaningful implementation, stop at design unless explicitly
authorized."* Nothing here needed that authorization to be useful — the
logic prototype already proves the model works before a single line of
production code changes.

## Relationship to PR #152

PR #152 remains prototype-only, unchanged, not touched by this work (see
final report §M for the explicit recommendation). This prototype is a
separate branch/PR by design — it answers a different question
(auditability) and should be reviewable independently of the linkage
engine it will eventually feed into.
