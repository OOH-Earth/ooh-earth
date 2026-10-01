# Data Intelligence Engine — Master R&D

Follow-up to PR #152 (Evidence Linkage Engine), #153 (Provenance model),
#154 (real-evidence recon). Read `MASTER_REPORT.md` first — it's the
synthesis. Everything else here is the evidence behind it.

## Contents

- **`MASTER_REPORT.md`** — architecture map, real dataset inventory,
  findings, canonical intelligence model recommendation, flywheel
  breakpoint analysis, opportunity scorecard, roadmap, and the reasoning
  for choosing (and for rejecting the default hypothesis of) the strongest
  vertical slice.
- **`coverage-recon-query.js`, `access-key-recon-query.js`,
  `crosstab-recon-query.js`, `branded-values-recon-query.js`** — the exact
  read-only, non-privileged, bounded, field-projected production queries
  run this session (app `6a62213cff3ccbca88c04ff5`). Re-runnable
  unchanged to reproduce every number in this report. No identity fields,
  no images, no `--privileged`, no writes, anywhere.
- **`real-branded-records.mjs`** — the complete real population (12
  records) of production `Location` rows with a non-empty `brand_name`.
  Public-advertisement data, not personal data. Labeled REAL,
  RUNTIME-VERIFIED.
- **`entityResolutionEngine.mjs`** — the prototype. Imports the real,
  unmodified `advertiserRegistry.js` directly from this worktree's
  checkout — not a copy. Adds: field-swap detection, a proposed (not
  shipped) brand→parent-corp alias table, and a zero-cost duplicate-
  placement candidate signal.
- **`benchmark.mjs`** — `node research/data-intelligence-model/benchmark.mjs`.
  Runs the real 12-record population through the engine (REAL section),
  then a 500-record synthetic stress test (clearly labeled SYNTHETIC
  FUNCTIONAL PROOF — NOT REAL-WORLD PERFORMANCE EVIDENCE). Zero
  dependencies, deterministic, exits 0.

## Why this isn't "Brand Evidence Monitor v0"

The mission's own suggested starting hypothesis was challenged and
rejected using real numbers, not intuition: production has exactly 12
real branded `Location` rows (1.2% field coverage) and zero real
`FieldCheck` re-observations. Building a "monitor" product on that would
be premature productization on almost no data. What the real data
*does* support is validating and hardening the deterministic
normalization layer underneath any future monitor — which is what got
built instead. See `MASTER_REPORT.md` §N for the full scoring
comparison.
