# DECISIONS — current, active only

Closed/historical decisions and their full rationale live in
`docs/ops/ooh-earth/07-DECISION-LOG.md`. This file holds only decisions that
should still shape behavior right now.

- **AdObservation is the preferred future multi-brand data model, but
  implementation is deferred**, low urgency — production data shows the
  multi-brand-concatenation symptom in under 2% of records. Don't build it
  speculatively; don't re-litigate the architecture question. Full package:
  `docs/ops/ooh-earth/09-MULTI-BRAND-DATA-MODEL.md`.
- **Founding Profile stays URL-only (share-by-link), no public directory.**
  `profile_public` is a self-editable visibility toggle, not directory
  consent — the two are different things and must not be conflated if this
  is ever revisited. Full package:
  `docs/ops/ooh-earth/10-FOUNDING-PROFILE-DISCOVERY.md`.
- **Don't force react-query migration to a round number.** Each remaining
  candidate needs its own fresh-source safety check; a file that looks like
  a previous "safe" pattern (e.g. `LabAdmin`) isn't automatically safe until
  actually read. `Plans.jsx`/`PortalOps.jsx`/`CareersAdmin.jsx` are
  evidence-deferred for specific, real reasons (payment polling logic,
  optimistic-update coupling, auto-provisioning writes) — don't touch
  without new evidence that changes the safety classification.
- **Don't chase Dave's Carto "API KEY REQUIRED" report or fix it
  speculatively.** He said it wasn't reproducing on Chrome and to probably
  ignore it. Reproduce first; if it doesn't reproduce, close as
  transient/environment-specific. Never rotate or change map-provider
  credentials without explicit authorization regardless of outcome.
- **Don't chase cosmetic/UX polish ahead of a live security gap.** When both
  are on the table (as of 2026-09-25: SEC-001/SEC-002 vs. Dave's map UX
  feedback), the security findings are prepared and escalated first, even
  though the UX items are what a non-engineer would notice sooner.
- **A sandbox/classifier denial is never routed around.** If `gh pr merge`,
  a deploy command, or similar gets denied, that's a stop-and-report
  checkpoint — recorded for a human to execute, not retried in another form.
